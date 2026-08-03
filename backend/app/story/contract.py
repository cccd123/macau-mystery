"""Strict runtime contract for version 1 story JSON documents."""
from __future__ import annotations

from typing import Annotated, Literal, Union
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


Identifier = Annotated[
    str,
    Field(min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$"),
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Gps(StrictModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Media(StrictModel):
    status: Literal["placeholder", "ready"]
    video_url: str = Field(min_length=1)
    poster_url: str = Field(min_length=1)
    mime_type: str = Field(min_length=1)
    duration_ms: int | None = Field(default=None, gt=0)

    @field_validator("video_url", "poster_url")
    @classmethod
    def require_http_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("must be an absolute HTTP(S) URL")
        return value


class Choice(StrictModel):
    id: Identifier
    text: str = Field(min_length=1)
    next_scene: Identifier
    grant_clues: list[Identifier]


class RouteCondition(StrictModel):
    default: bool | None = None
    min_clue_count: int | None = Field(default=None, ge=1)
    all_clues: list[Identifier] | None = None
    any_clues: list[Identifier] | None = None

    @model_validator(mode="after")
    def validate_condition_shape(self) -> "RouteCondition":
        fields = (self.min_clue_count, self.all_clues, self.any_clues)
        if self.default is not None:
            if self.default is not True or any(field is not None for field in fields):
                raise ValueError("default must be exactly {default: true}")
            return self
        if all(field is None for field in fields):
            raise ValueError("a non-default condition must contain a supported field")
        for name in ("all_clues", "any_clues"):
            clues = getattr(self, name)
            if clues is not None and (not clues or len(clues) != len(set(clues))):
                raise ValueError(f"{name} must be a non-empty list without duplicates")
        return self


class Route(StrictModel):
    priority: int
    when: RouteCondition
    next_scene: Identifier


class VideoScene(StrictModel):
    id: Identifier
    type: Literal["video"]
    media: Media
    choices: list[Choice]


class EndingScene(StrictModel):
    id: Identifier
    type: Literal["ending"]
    ending_code: Identifier
    media: Media
    choices: list[Choice]

    @model_validator(mode="after")
    def require_no_choices(self) -> "EndingScene":
        if self.choices:
            raise ValueError("ending choices must be empty")
        return self


class RouterScene(StrictModel):
    id: Identifier
    type: Literal["router"]
    routes: list[Route] = Field(min_length=1)


Scene = Annotated[Union[VideoScene, EndingScene, RouterScene], Field(discriminator="type")]


class Chapter(StrictModel):
    id: Identifier
    title: str = Field(min_length=1)
    location: str = Field(min_length=1)
    gps: Gps | None = None
    scenes: list[Scene]


class ClueDefinition(StrictModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    icon: str | None = Field(default=None, min_length=1)


class StoryDocument(StrictModel):
    schema_version: Literal[1]
    story_id: Identifier
    title: str = Field(min_length=1)
    description: str | None = None
    entry_scene: Identifier
    chapters: list[Chapter] = Field(min_length=1)
    clues: dict[Identifier, ClueDefinition]
