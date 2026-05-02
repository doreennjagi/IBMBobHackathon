"""ORM metadata smoke tests (no database connection required)."""

from app.models import AgentOutput, Base, PriceAlert, Subscription, User
from app.models.base import Base as BaseAlias


def test_declarative_base_singleton() -> None:
    assert Base is BaseAlias


def test_model_tables_registered() -> None:
    names = set(Base.metadata.tables.keys())
    assert "users" in names
    assert "subscriptions" in names
    assert "price_alerts" in names
    assert "agent_outputs" in names


def test_model_classes_importable() -> None:
    assert User.__tablename__ == "users"
    assert Subscription.__tablename__ == "subscriptions"
    assert PriceAlert.__tablename__ == "price_alerts"
    assert AgentOutput.__tablename__ == "agent_outputs"
