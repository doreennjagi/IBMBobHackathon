"""
Subscription ORM model: recurring merchant relationship and billing snapshot fields.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.agent_output import AgentOutput
    from app.models.price_alert import PriceAlert
    from app.models.user import User

# Lifecycle in provider / user tracking (distinct from wellness UI band)
subscription_status_type = SQLEnum(
    "active", "cancelled", "flagged", name="subscription_status", create_constraint=True
)
wellness_band_type = SQLEnum(
    "active", "zombie", "escalating", "critical", name="wellness_band", create_constraint=True
)


class Subscription(Base):
    """
    A detected or manually tracked subscription for one user.

    ``status`` follows the hackathon schema (active / cancelled / flagged).
    ``wellness_band`` drives dashboard health badges (Active / Zombie / Escalating / Critical).
    """

    __tablename__ = "subscriptions"
    __table_args__ = (
        Index("ix_subscriptions_user_id", "user_id"),
        Index("ix_subscriptions_merchant_name", "merchant_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    merchant_name: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False, default="general")
    billing_cycle: Mapped[str] = mapped_column(String(64), nullable=False, default="monthly")

    base_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    last_billed_date = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(subscription_status_type, nullable=False, server_default="active")

    # Pattern-detector confidence [0,1]; separate from account status above
    confidence_score = mapped_column(Numeric(5, 4), nullable=True)

    wellness_band: Mapped[str] = mapped_column(
        wellness_band_type,
        nullable=False,
        server_default="active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    price_alerts: Mapped[list["PriceAlert"]] = relationship(
        "PriceAlert", back_populates="subscription", cascade="all, delete-orphan"
    )
    agent_outputs: Mapped[list["AgentOutput"]] = relationship(
        "AgentOutput", back_populates="subscription", cascade="all, delete-orphan"
    )
