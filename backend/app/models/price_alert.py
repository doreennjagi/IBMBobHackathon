"""
PriceAlert ORM model: detected subscription price changes for user workflows.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.subscription import Subscription

alert_status_type = SQLEnum("new", "viewed", "actioned", name="alert_status", create_constraint=True)


class PriceAlert(Base):
    """Stores one detected price transition on a subscription timeline."""

    __tablename__ = "price_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    old_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    new_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    increase_percentage: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)

    alert_status: Mapped[str] = mapped_column(alert_status_type, nullable=False, server_default="new")

    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="price_alerts")
