"""Transactional game progression for the versioned story runtime."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db_models import GameEvent, GameSession, SessionClue, Story, StoryVersion, utc_now
from app.game_errors import GameError
from app.models import (
    ChoiceRequest,
    GameChapterResponse,
    GameChoiceResponse,
    GameClueResponse,
    GameEndingResponse,
    GameMediaResponse,
    GamePreloadResponse,
    GameProgressResponse,
    GameSceneResponse,
    GameSnapshot,
    GameStoryResponse,
)
from app.story.contract import EndingScene, StoryDocument, VideoScene
from app.story.runtime import StoryGraph, StoryRuntimeError
from app.story.validator import validate_story_data


class GameService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def start_game(self, script_id: str) -> GameSnapshot:
        async with self.session.begin():
            story, version, document, graph = await self._active_story(script_id)
            try:
                entry_scene = graph.resolve(document.entry_scene, set())
            except StoryRuntimeError as exc:
                raise self._corrupted_story(version.id) from exc
            if not isinstance(entry_scene, VideoScene):
                raise self._corrupted_story(version.id)

            game_session = GameSession(
                story_version_id=version.id,
                current_scene_key=entry_scene.id,
                status="active",
                last_active_at=utc_now(),
            )
            self.session.add(game_session)
            await self.session.flush()
            self.session.add(
                GameEvent(
                    session_id=game_session.id,
                    sequence_number=1,
                    event_type="game_started",
                    next_scene_key=entry_scene.id,
                )
            )
            return await self._snapshot(game_session, version, document, graph)

    async def get_state(self, session_id: str) -> GameSnapshot:
        game_session = await self.session.get(GameSession, session_id)
        if game_session is None:
            raise GameError(404, "SESSION_NOT_FOUND", "游戏会话不存在")
        version, document, graph = await self._session_story(game_session)
        return await self._snapshot(game_session, version, document, graph)

    async def make_choice(self, request: ChoiceRequest) -> GameSnapshot:
        if self.session.get_bind().dialect.name == "sqlite":
            await self.session.execute(text("BEGIN IMMEDIATE"))
            try:
                snapshot = await self._make_choice_in_transaction(request)
                await self.session.commit()
                return snapshot
            except BaseException:
                await self.session.rollback()
                raise

        async with self.session.begin():
            return await self._make_choice_in_transaction(request)

    async def _make_choice_in_transaction(self, request: ChoiceRequest) -> GameSnapshot:
        replay = await self._find_replay(request)
        if replay is not None:
            return replay

        game_session = await self.session.scalar(
            select(GameSession).where(GameSession.id == str(request.session_id)).with_for_update()
        )
        if game_session is None:
            raise GameError(404, "SESSION_NOT_FOUND", "游戏会话不存在")

        # A second lookup is required after the session lock for concurrent PostgreSQL requests.
        replay = await self._find_replay(request)
        if replay is not None:
            return replay

        if game_session.status == "completed":
            raise GameError(409, "SESSION_COMPLETED", "游戏会话已经结束")
        if game_session.status != "active":
            raise GameError(409, "SESSION_NOT_ACTIVE", "游戏会话当前不可继续")
        if game_session.current_scene_key != request.scene_id:
            raise GameError(
                409,
                "STALE_SCENE",
                "提交的场景不是当前游戏场景",
                {
                    "submitted_scene_id": request.scene_id,
                    "current_scene_id": game_session.current_scene_key,
                },
            )

        version, document, graph = await self._session_story(game_session)
        context = graph.scene_context(game_session.current_scene_key)
        if not isinstance(context.scene, VideoScene):
            raise self._corrupted_story(version.id)
        try:
            choice = graph.choice(game_session.current_scene_key, request.choice_id)
        except StoryRuntimeError as exc:
            raise GameError(409, "CHOICE_NOT_AVAILABLE", "选项不属于当前场景") from exc

        clues = await self._session_clues(game_session.id)
        clue_ids = {clue.clue_key for clue in clues}
        sequence_number = await self._next_sequence_number(game_session.id)
        choice_event = GameEvent(
            session_id=game_session.id,
            sequence_number=sequence_number,
            event_type="choice_made",
            scene_key=game_session.current_scene_key,
            choice_key=choice.id,
            request_id=str(request.request_id),
            payload_json={"request": self._request_payload(request)},
        )
        self.session.add(choice_event)
        await self.session.flush()

        awarded: list[SessionClue] = []
        for clue_id in choice.grant_clues:
            if clue_id in clue_ids:
                continue
            sequence_number += 1
            clue_event = GameEvent(
                session_id=game_session.id,
                sequence_number=sequence_number,
                event_type="clue_granted",
                scene_key=game_session.current_scene_key,
                choice_key=choice.id,
                payload_json={"clue_id": clue_id},
            )
            self.session.add(clue_event)
            await self.session.flush()
            session_clue = SessionClue(
                session_id=game_session.id,
                clue_key=clue_id,
                source_event_id=clue_event.id,
            )
            self.session.add(session_clue)
            awarded.append(session_clue)
            clue_ids.add(clue_id)

        try:
            target_scene = graph.resolve(choice.next_scene, clue_ids)
        except StoryRuntimeError as exc:
            raise self._corrupted_story(version.id) from exc

        choice_event.next_scene_key = target_scene.id
        now = utc_now()
        game_session.current_scene_key = target_scene.id
        game_session.last_active_at = now
        if isinstance(target_scene, EndingScene):
            game_session.status = "completed"
            game_session.ending_scene_key = target_scene.id
            game_session.completed_at = now
            sequence_number += 1
            self.session.add(
                GameEvent(
                    session_id=game_session.id,
                    sequence_number=sequence_number,
                    event_type="game_completed",
                    scene_key=target_scene.id,
                    next_scene_key=target_scene.id,
                )
            )

        snapshot = await self._snapshot(game_session, version, document, graph, awarded=awarded)
        choice_event.payload_json = {
            "request": self._request_payload(request),
            "response": snapshot.model_dump(mode="json", exclude_none=True),
        }
        await self.session.flush()
        return snapshot

    async def _active_story(self, script_id: str) -> tuple[Story, StoryVersion, StoryDocument, StoryGraph]:
        story = await self.session.scalar(select(Story).where(Story.slug == script_id))
        if story is None:
            raise GameError(404, "STORY_NOT_FOUND", "故事不存在")
        if story.status != "published":
            raise GameError(409, "STORY_NOT_PUBLISHED", "故事尚未发布")
        if not story.active_version_id:
            raise GameError(503, "STORY_NOT_READY", "故事没有可用的已发布版本")
        version = await self.session.get(StoryVersion, story.active_version_id)
        if version is None or version.status != "published":
            raise GameError(503, "STORY_NOT_READY", "故事版本暂不可用")
        document, graph = self._story_graph(version)
        self._ensure_media_ready(document)
        return story, version, document, graph

    async def _session_story(self, game_session: GameSession) -> tuple[StoryVersion, StoryDocument, StoryGraph]:
        version = await self.session.get(StoryVersion, game_session.story_version_id)
        if version is None:
            raise self._corrupted_story(game_session.story_version_id)
        document, graph = self._story_graph(version)
        return version, document, graph

    def _story_graph(self, version: StoryVersion) -> tuple[StoryDocument, StoryGraph]:
        validation = validate_story_data(version.content_json, allow_placeholder_media=True)
        if not validation.valid:
            raise self._corrupted_story(version.id)
        try:
            document = StoryDocument.model_validate(version.content_json)
            return document, StoryGraph(document)
        except (ValueError, TypeError) as exc:
            raise self._corrupted_story(version.id) from exc

    def _ensure_media_ready(self, document: StoryDocument) -> None:
        if not get_settings().is_production:
            return
        for chapter in document.chapters:
            for scene in chapter.scenes:
                if isinstance(scene, (VideoScene, EndingScene)) and scene.media.status != "ready":
                    raise GameError(503, "STORY_NOT_READY", "故事媒体尚未准备完成")

    async def _snapshot(
        self,
        game_session: GameSession,
        version: StoryVersion,
        document: StoryDocument,
        graph: StoryGraph,
        *,
        awarded: Iterable[SessionClue] | None = None,
    ) -> GameSnapshot:
        clues = await self._session_clues(game_session.id)
        clue_ids = {clue.clue_key for clue in clues}
        try:
            scene = graph.scene_context(game_session.current_scene_key).scene
        except StoryRuntimeError as exc:
            raise self._corrupted_story(version.id) from exc

        if game_session.status == "active" and not isinstance(scene, VideoScene):
            raise self._corrupted_story(version.id)
        if game_session.status == "completed" and not isinstance(scene, EndingScene):
            raise self._corrupted_story(version.id)
        if game_session.status not in {"active", "completed"}:
            raise GameError(409, "SESSION_NOT_ACTIVE", "游戏会话当前不可继续")

        ending = None
        if isinstance(scene, EndingScene):
            ending = GameEndingResponse(id=scene.id, code=scene.ending_code)

        snapshot = GameSnapshot(
            session_id=game_session.id,
            status=game_session.status,
            story=GameStoryResponse(
                id=document.story_id,
                title=document.title,
                version=version.version_number,
            ),
            scene=self._scene_response(document, graph, scene, clue_ids),
            clues=[self._clue_response(document, clue) for clue in clues],
            progress=GameProgressResponse(
                current_chapter=graph.scene_context(scene.id).chapter_index + 1,
                total_chapters=len(document.chapters),
            ),
            awarded_clues=(
                [self._clue_response(document, clue) for clue in awarded] if awarded is not None else None
            ),
            ending=ending,
        )
        return snapshot

    def _scene_response(
        self,
        document: StoryDocument,
        graph: StoryGraph,
        scene: VideoScene | EndingScene,
        clue_ids: set[str],
    ) -> GameSceneResponse:
        context = graph.scene_context(scene.id)
        chapter = document.chapters[context.chapter_index]
        choices: list[GameChoiceResponse] = []
        if isinstance(scene, VideoScene):
            for choice in scene.choices:
                try:
                    preload_scene = graph.preview_choice(scene.id, choice.id, clue_ids)
                except StoryRuntimeError as exc:
                    raise self._corrupted_story(document.story_id) from exc
                choices.append(
                    GameChoiceResponse(
                        id=choice.id,
                        text=choice.text,
                        preload=GamePreloadResponse(
                            scene_id=preload_scene.id,
                            media=self._media_response(preload_scene.media),
                        ),
                    )
                )
        return GameSceneResponse(
            id=scene.id,
            type=scene.type,
            chapter=GameChapterResponse(id=chapter.id, title=chapter.title, location=chapter.location),
            media=self._media_response(scene.media),
            choices=choices,
        )

    @staticmethod
    def _media_response(media) -> GameMediaResponse:
        return GameMediaResponse(
            video_url=media.video_url,
            poster_url=media.poster_url,
            mime_type=media.mime_type,
            duration_ms=media.duration_ms,
        )

    @staticmethod
    def _clue_response(document: StoryDocument, clue: SessionClue) -> GameClueResponse:
        definition = document.clues.get(clue.clue_key)
        if definition is None:
            raise GameError(500, "STORY_DATA_CORRUPTED", "会话绑定的剧情数据异常")
        return GameClueResponse(
            id=clue.clue_key,
            title=definition.title,
            description=definition.description,
            icon=definition.icon,
            acquired_at=clue.acquired_at,
        )

    async def _session_clues(self, session_id: str) -> list[SessionClue]:
        result = await self.session.scalars(
            select(SessionClue)
            .where(SessionClue.session_id == session_id)
            .order_by(SessionClue.acquired_at, SessionClue.clue_key)
        )
        return list(result)

    async def _next_sequence_number(self, session_id: str) -> int:
        maximum = await self.session.scalar(
            select(func.max(GameEvent.sequence_number)).where(GameEvent.session_id == session_id)
        )
        return (maximum or 0) + 1

    async def _find_replay(self, request: ChoiceRequest) -> GameSnapshot | None:
        event = await self.session.scalar(
            select(GameEvent).where(
                GameEvent.session_id == str(request.session_id),
                GameEvent.request_id == str(request.request_id),
            )
        )
        if event is None:
            return None
        payload = event.payload_json or {}
        if payload.get("request") != self._request_payload(request):
            raise GameError(409, "IDEMPOTENCY_CONFLICT", "request_id 已用于不同的选择请求")
        try:
            return GameSnapshot.model_validate(payload["response"])
        except (KeyError, TypeError, ValueError) as exc:
            raise GameError(500, "IDEMPOTENCY_RECORD_CORRUPTED", "幂等响应记录异常") from exc

    @staticmethod
    def _request_payload(request: ChoiceRequest) -> dict[str, str]:
        return {
            "session_id": str(request.session_id),
            "scene_id": request.scene_id,
            "choice_id": request.choice_id,
        }

    @staticmethod
    def _corrupted_story(version_id: str) -> GameError:
        return GameError(
            500,
            "STORY_DATA_CORRUPTED",
            "会话绑定的已发布剧情数据异常",
            {"story_version_id": version_id},
        )
