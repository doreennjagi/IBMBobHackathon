"""
Shared SQLAlchemy declarative base for all ORM models.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Application-wide metadata registry for mapped classes."""

    pass
