"""
User ORM model: authentication identity and agent-related preferences stored as JSONB.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.subscription import Subscription


class User(Base):
    """
    End user account.

    ``preferences`` holds non-PII agent settings (e.g. cancellation letter tone)
    as arbitrary JSON for forward-compatible evolution without migrations per flag.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    preferences = mapped_column(JSONB, nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="user", cascade="all, delete-orphan"
    )
