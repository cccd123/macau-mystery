"""Migration coverage for the first persistent game schema."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect


BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_initial_migration_creates_game_persistence_schema(tmp_path: Path) -> None:
    database_path = tmp_path / "migration.db"
    environment = os.environ.copy()
    environment["DATABASE_URL"] = f"sqlite+aiosqlite:///{database_path.as_posix()}"

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr

    engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    inspector = inspect(engine)
    assert {
        "stories",
        "story_versions",
        "game_sessions",
        "game_events",
        "session_clues",
        "users",
        "auth_sessions",
    }.issubset(
        inspector.get_table_names()
    )
    assert any(
        foreign_key["referred_table"] == "story_versions"
        for foreign_key in inspector.get_foreign_keys("stories")
    )
    assert any(
        set(constraint["column_names"]) == {"session_id", "request_id"}
        for constraint in inspector.get_unique_constraints("game_events")
    )
    assert any(
        set(constraint["column_names"]) == {"username_key"}
        for constraint in inspector.get_unique_constraints("users")
    )
    assert any(
        foreign_key["referred_table"] == "users"
        for foreign_key in inspector.get_foreign_keys("auth_sessions")
    )
    engine.dispose()
