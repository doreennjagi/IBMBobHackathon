"""
AgentOutput ORM model: watsonx (or other) agent generations with optional user edits and ratings.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.subscription import Subscription

agent_type_type = SQLEnum(
    "cancellation", "negotiation", "router", "other", name="agent_type", create_constraint=True
)


class AgentOutput(Base):
    """One persisted agent run: original text, optional user-edited copy, and quality feedback."""

    __tablename__ = "agent_outputs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    agent_type: Mapped[str] = mapped_column(agent_type_type, nullable=False)

    generated_text: Mapped[str] = mapped_column(Text, nullable=False)
    # Omit ``Mapped[X | None]`` here: SQLAlchemy 2.0.25 + Python 3.14 typing union scan can raise TypeError.
    user_edited_text = mapped_column(Text, nullable=True)
    quality_rating = mapped_column(Integer, nullable=True)  # 1–5 when set

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="agent_outputs")
