from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship
import enum

class Base(DeclarativeBase):
    pass

class SubscriptionFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BI_WEEKLY = "bi-weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "Active"
    ZOMBIE = "Zombie"
    ESCALATING = "Escalating"
    CRITICAL = "Critical"

class AlertLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class AgentAction(str, enum.Enum):
    CANCEL = "cancel"
    NEGOTIATE = "negotiate"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_name = Column(String(200), nullable=False)
    canonical_name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=True)
    known_provider = Column(Boolean, default=False)
    frequency = Column(Enum(SubscriptionFrequency), nullable=False)
    average_amount = Column(Float, nullable=False)
    latest_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="KES")
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    confidence_score = Column(Float, default=0.0)
    first_detected = Column(DateTime, nullable=False)
    last_detected = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="subscriptions")
    price_alerts = relationship("PriceAlert", back_populates="subscription", cascade="all, delete-orphan")
    agent_outputs = relationship("AgentOutput", back_populates="subscription", cascade="all, delete-orphan")

class PriceAlert(Base):
    __tablename__ = "price_alerts"
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    original_price = Column(Float, nullable=False)
    new_price = Column(Float, nullable=False)
    percentage_change = Column(Float, nullable=False)
    months_affected = Column(Integer, default=0)
    total_overcharge = Column(Float, default=0.0)
    alert_level = Column(Enum(AlertLevel), nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged = Column(Boolean, default=False)
    subscription = relationship("Subscription", back_populates="price_alerts")

class AgentOutput(Base):
    __tablename__ = "agent_outputs"
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(Enum(AgentAction), nullable=False)
    content_text = Column(Text, nullable=False)
    model_used = Column(String(100), default="ibm/granite-13b-instruct-v2")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_rating = Column(Integer, nullable=True)
    subscription = relationship("Subscription", back_populates="agent_outputs")

def init_db(database_url: str):
    engine = create_engine(database_url, echo=False)
    Base.metadata.create_all(bind=engine)
    return engine
