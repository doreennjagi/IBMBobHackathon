"""Initial schema: users, subscriptions, price_alerts, agent_outputs.

Revision ID: 20260502_0001
Revises:
Create Date: 2026-05-02

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260502_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    subscription_status = postgresql.ENUM(
        "active", "cancelled", "flagged", name="subscription_status", create_type=True
    )
    wellness_band = postgresql.ENUM(
        "active", "zombie", "escalating", "critical", name="wellness_band", create_type=True
    )
    alert_status = postgresql.ENUM("new", "viewed", "actioned", name="alert_status", create_type=True)
    agent_type = postgresql.ENUM(
        "cancellation", "negotiation", "router", "other", name="agent_type", create_type=True
    )

    subscription_status.create(op.get_bind(), checkfirst=True)
    wellness_band.create(op.get_bind(), checkfirst=True)
    alert_status.create(op.get_bind(), checkfirst=True)
    agent_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("preferences", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("merchant_name", sa.String(length=512), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("billing_cycle", sa.String(length=64), nullable=False),
        sa.Column("base_cost", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("current_cost", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("last_billed_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            subscription_status,
            server_default=sa.text("'active'::subscription_status"),
            nullable=False,
        ),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column(
            "wellness_band",
            wellness_band,
            server_default=sa.text("'active'::wellness_band"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=False)
    op.create_index("ix_subscriptions_merchant_name", "subscriptions", ["merchant_name"], unique=False)

    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("old_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("new_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("increase_percentage", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.Column(
            "alert_status",
            alert_status,
            server_default=sa.text("'new'::alert_status"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_price_alerts_subscription_id", "price_alerts", ["subscription_id"], unique=False)

    op.create_table(
        "agent_outputs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("agent_type", agent_type, nullable=False),
        sa.Column("generated_text", sa.Text(), nullable=False),
        sa.Column("user_edited_text", sa.Text(), nullable=True),
        sa.Column("quality_rating", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_outputs_subscription_id", "agent_outputs", ["subscription_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_agent_outputs_subscription_id", table_name="agent_outputs")
    op.drop_table("agent_outputs")

    op.drop_index("ix_price_alerts_subscription_id", table_name="price_alerts")
    op.drop_table("price_alerts")

    op.drop_index("ix_subscriptions_merchant_name", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS agent_type CASCADE")
    op.execute("DROP TYPE IF EXISTS alert_status CASCADE")
    op.execute("DROP TYPE IF EXISTS wellness_band CASCADE")
    op.execute("DROP TYPE IF EXISTS subscription_status CASCADE")
