"""Command-line entry points for validating and importing story JSON."""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app.config import get_settings
from app.db import SessionLocal
from app.story.importer import StoryImportValidationError, import_story_file, load_story_json
from app.story.validator import validate_story_data


def _print_json(value: dict) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


async def _run(args: argparse.Namespace) -> int:
    settings = get_settings()
    path = Path(args.path)
    if args.command == "validate":
        result = validate_story_data(
            load_story_json(path), allow_placeholder_media=not settings.is_production
        )
        _print_json(result.model_dump())
        return 0 if result.valid else 1

    try:
        async with SessionLocal() as session:
            result = await import_story_file(
                session,
                path,
                publish=args.publish,
                allow_placeholder_media=not settings.is_production,
            )
    except StoryImportValidationError as exc:
        _print_json(exc.result.model_dump())
        return 1
    _print_json(result.to_dict())
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate or import Macau Mystery story JSON")
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("validate", "import"):
        subparser = subparsers.add_parser(command)
        subparser.add_argument("path")
        if command == "import":
            subparser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_run(args)))


if __name__ == "__main__":
    main()
