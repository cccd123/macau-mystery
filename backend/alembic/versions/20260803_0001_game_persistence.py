"""Create persistent storage for versioned stories and game sessions.

Revision ID: 20260803_0001
Revises:
Create Date: 2026-08-03
"""
from alembic import op
import sqlalchemy as sa


revision = "20260803_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stories",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("active_version_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('draft', 'published', 'retired')", name="ck_stories_status"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_stories_slug", "stories", ["slug"], unique=False)
    op.create_table(
        "story_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("story_id", sa.String(length=36), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'published', 'retired')", name="ck_story_versions_status"),
        sa.ForeignKeyConstraint(["story_id"], ["stories.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("story_id", "version_number", name="uq_story_versions_story_version"),
        sa.UniqueConstraint("story_id", "content_hash", name="uq_story_versions_story_hash"),
    )

    if op.get_bind().dialect.name == "sqlite":
        with op.batch_alter_table("stories", recreate="always") as batch_op:
            batch_op.create_foreign_key(
                "fk_stories_active_version_id_story_versions",
                "story_versions",
                ["active_version_id"],
                ["id"],
                ondelete="SET NULL",
            )
    else:
        op.create_foreign_key(
            "fk_stories_active_version_id_story_versions",
            "stories",
            "story_versions",
            ["active_version_id"],
            ["id"],
            ondelete="SET NULL",
        )

    op.create_table(
        "game_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("story_version_id", sa.String(length=36), nullable=False),
        sa.Column("current_scene_key", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("ending_scene_key", sa.String(length=64), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('active', 'completed', 'abandoned')", name="ck_game_sessions_status"),
        sa.ForeignKeyConstraint(["story_version_id"], ["story_versions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_game_sessions_story_version_id", "game_sessions", ["story_version_id"], unique=False)
    op.create_table(
        "game_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("scene_key", sa.String(length=64), nullable=True),
        sa.Column("choice_key", sa.String(length=64), nullable=True),
        sa.Column("next_scene_key", sa.String(length=64), nullable=True),
        sa.Column("request_id", sa.String(length=36), nullable=True),
        sa.Column("payload_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["game_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "sequence_number", name="uq_game_events_session_sequence"),
        sa.UniqueConstraint("session_id", "request_id", name="uq_game_events_session_request"),
    )
    op.create_index("ix_game_events_session_id", "game_events", ["session_id"], unique=False)
    op.create_table(
        "session_clues",
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("clue_key", sa.String(length=64), nullable=False),
        sa.Column("source_event_id", sa.Integer(), nullable=True),
        sa.Column("acquired_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["game_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_event_id"], ["game_events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("session_id", "clue_key"),
    )


def downgrade() -> None:
    op.drop_table("session_clues")
    op.drop_index("ix_game_events_session_id", table_name="game_events")
    op.drop_table("game_events")
    op.drop_index("ix_game_sessions_story_version_id", table_name="game_sessions")
    op.drop_table("game_sessions")
    if op.get_bind().dialect.name == "sqlite":
        with op.batch_alter_table("stories", recreate="always") as batch_op:
            batch_op.drop_constraint("fk_stories_active_version_id_story_versions", type_="foreignkey")
    else:
        op.drop_constraint("fk_stories_active_version_id_story_versions", "stories", type_="foreignkey")
    op.drop_table("story_versions")
    op.drop_index("ix_stories_slug", table_name="stories")
    op.drop_table("stories")
