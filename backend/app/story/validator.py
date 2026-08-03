"""Structural and semantic validation for story JSON documents."""
from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.story.contract import EndingScene, RouterScene, Scene, StoryDocument, VideoScene


class ValidationIssue(BaseModel):
    code: str
    path: str
    message: str


class StoryValidationResult(BaseModel):
    valid: bool
    errors: list[ValidationIssue] = Field(default_factory=list)
    warnings: list[ValidationIssue] = Field(default_factory=list)


def _path(location: tuple[Any, ...]) -> str:
    result = ""
    for part in location:
        if isinstance(part, int):
            result += f"[{part}]"
        elif result:
            result += f".{part}"
        else:
            result = str(part)
    return result or "$"


def _issue(code: str, path: str, message: str) -> ValidationIssue:
    return ValidationIssue(code=code, path=path, message=message)


def validate_story_data(data: dict[str, Any], *, allow_placeholder_media: bool) -> StoryValidationResult:
    try:
        document = StoryDocument.model_validate(data)
    except ValidationError as exc:
        return StoryValidationResult(
            valid=False,
            errors=[
                _issue("SCHEMA_VALIDATION_ERROR", _path(error["loc"]), error["msg"])
                for error in exc.errors()
            ],
        )
    return validate_story_document(document, allow_placeholder_media=allow_placeholder_media)


def validate_story_document(
    document: StoryDocument, *, allow_placeholder_media: bool
) -> StoryValidationResult:
    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []
    scene_by_id: dict[str, Scene] = {}
    scene_paths: dict[str, str] = {}
    edges: dict[str, list[str]] = defaultdict(list)

    chapter_ids: set[str] = set()
    for chapter_index, chapter in enumerate(document.chapters):
        chapter_path = f"chapters[{chapter_index}]"
        if chapter.id in chapter_ids:
            errors.append(_issue("DUPLICATE_CHAPTER_ID", f"{chapter_path}.id", f"章节 {chapter.id} 重复"))
        chapter_ids.add(chapter.id)

        for scene_index, scene in enumerate(chapter.scenes):
            scene_path = f"{chapter_path}.scenes[{scene_index}]"
            if scene.id in scene_by_id:
                errors.append(_issue("DUPLICATE_SCENE_ID", f"{scene_path}.id", f"场景 {scene.id} 重复"))
                continue
            scene_by_id[scene.id] = scene
            scene_paths[scene.id] = scene_path

            if isinstance(scene, (VideoScene, EndingScene)) and (
                scene.media.status == "placeholder" and not allow_placeholder_media
            ):
                errors.append(
                    _issue(
                        "PLACEHOLDER_MEDIA_NOT_ALLOWED",
                        f"{scene_path}.media.status",
                        "当前环境不允许发布 placeholder 媒体",
                    )
                )

            if isinstance(scene, VideoScene):
                choice_ids: set[str] = set()
                for choice_index, choice in enumerate(scene.choices):
                    choice_path = f"{scene_path}.choices[{choice_index}]"
                    if choice.id in choice_ids:
                        errors.append(
                            _issue("DUPLICATE_CHOICE_ID", f"{choice_path}.id", f"选项 {choice.id} 重复")
                        )
                    choice_ids.add(choice.id)
                    edges[scene.id].append(choice.next_scene)
                    for clue_index, clue_id in enumerate(choice.grant_clues):
                        if clue_id not in document.clues:
                            errors.append(
                                _issue(
                                    "UNKNOWN_CLUE_REFERENCE",
                                    f"{choice_path}.grant_clues[{clue_index}]",
                                    f"线索 {clue_id} 未在 clues 中定义",
                                )
                            )
            elif isinstance(scene, RouterScene):
                priorities: set[int] = set()
                default_routes = []
                for route_index, route in enumerate(scene.routes):
                    route_path = f"{scene_path}.routes[{route_index}]"
                    if route.priority in priorities:
                        errors.append(
                            _issue("DUPLICATE_ROUTE_PRIORITY", f"{route_path}.priority", "router priority 必须唯一")
                        )
                    priorities.add(route.priority)
                    edges[scene.id].append(route.next_scene)
                    if route.when.default:
                        default_routes.append(route)
                    for condition_name in ("all_clues", "any_clues"):
                        clue_ids = getattr(route.when, condition_name) or []
                        for clue_index, clue_id in enumerate(clue_ids):
                            if clue_id not in document.clues:
                                errors.append(
                                    _issue(
                                        "UNKNOWN_CLUE_REFERENCE",
                                        f"{route_path}.when.{condition_name}[{clue_index}]",
                                        f"线索 {clue_id} 未在 clues 中定义",
                                    )
                                )
                if len(default_routes) != 1:
                    errors.append(
                        _issue("INVALID_DEFAULT_ROUTE", f"{scene_path}.routes", "router 必须且只能有一条默认规则")
                    )
                elif default_routes[0].priority != max(priorities):
                    errors.append(
                        _issue(
                            "DEFAULT_ROUTE_PRIORITY",
                            f"{scene_path}.routes",
                            "默认规则的 priority 必须是最大值",
                        )
                    )

    for scene_id, targets in edges.items():
        for target_index, target_id in enumerate(targets):
            if target_id not in scene_by_id:
                errors.append(
                    _issue(
                        "MISSING_SCENE_TARGET",
                        scene_paths[scene_id],
                        f"场景 {scene_id} 的第 {target_index + 1} 个跳转目标 {target_id} 不存在",
                    )
                )

    entry_scene = scene_by_id.get(document.entry_scene)
    if entry_scene is None:
        errors.append(_issue("MISSING_ENTRY_SCENE", "entry_scene", f"入口场景 {document.entry_scene} 不存在"))
    elif not isinstance(entry_scene, VideoScene):
        errors.append(_issue("INVALID_ENTRY_SCENE", "entry_scene", "入口场景必须是 video 节点"))

    if entry_scene is not None:
        reachable = _reachable(document.entry_scene, edges, scene_by_id)
        for scene_id, scene in scene_by_id.items():
            if scene_id not in reachable:
                warnings.append(
                    _issue("UNREACHABLE_SCENE", scene_paths[scene_id], f"场景 {scene_id} 无法从入口到达")
                )
            elif isinstance(scene, VideoScene) and not scene.choices:
                errors.append(
                    _issue("VIDEO_WITHOUT_CHOICES", scene_paths[scene_id], "可达 video 节点至少需要一个选项")
                )

        reachable_endings = {scene_id for scene_id in reachable if isinstance(scene_by_id[scene_id], EndingScene)}
        if not reachable_endings:
            errors.append(_issue("NO_REACHABLE_ENDING", "entry_scene", "入口没有可达结局"))
        else:
            can_finish = _nodes_with_path_to_ending(reachable, edges, reachable_endings)
            for scene_id in sorted(reachable - can_finish):
                errors.append(
                    _issue(
                        "NO_PATH_TO_ENDING",
                        scene_paths[scene_id],
                        f"场景 {scene_id} 没有通向结局的路径",
                    )
                )

        errors.extend(_router_cycle_issues(reachable, edges, scene_by_id, scene_paths))

    return StoryValidationResult(valid=not errors, errors=errors, warnings=warnings)


def _reachable(entry_scene: str, edges: dict[str, list[str]], scene_by_id: dict[str, Scene]) -> set[str]:
    reachable: set[str] = set()
    queue: deque[str] = deque([entry_scene])
    while queue:
        scene_id = queue.popleft()
        if scene_id in reachable or scene_id not in scene_by_id:
            continue
        reachable.add(scene_id)
        queue.extend(edges.get(scene_id, []))
    return reachable


def _nodes_with_path_to_ending(
    reachable: set[str], edges: dict[str, list[str]], endings: set[str]
) -> set[str]:
    reverse_edges: dict[str, set[str]] = defaultdict(set)
    for source, targets in edges.items():
        for target in targets:
            if source in reachable and target in reachable:
                reverse_edges[target].add(source)
    result = set(endings)
    queue: deque[str] = deque(endings)
    while queue:
        current = queue.popleft()
        for parent in reverse_edges[current]:
            if parent not in result:
                result.add(parent)
                queue.append(parent)
    return result


def _router_cycle_issues(
    reachable: set[str],
    edges: dict[str, list[str]],
    scene_by_id: dict[str, Scene],
    scene_paths: dict[str, str],
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    visited: set[str] = set()
    stack: set[str] = set()

    def visit(scene_id: str) -> None:
        if scene_id in stack:
            issues.append(_issue("ROUTER_CYCLE", scene_paths[scene_id], f"router 链在 {scene_id} 形成循环"))
            return
        if scene_id in visited:
            return
        visited.add(scene_id)
        stack.add(scene_id)
        for target in edges.get(scene_id, []):
            if target in reachable and isinstance(scene_by_id.get(target), RouterScene):
                visit(target)
        stack.remove(scene_id)

    for scene_id in reachable:
        if isinstance(scene_by_id[scene_id], RouterScene):
            visit(scene_id)
    return issues
