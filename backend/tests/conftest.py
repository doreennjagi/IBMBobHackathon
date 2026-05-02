"""
Pytest fixtures shared across backend tests.

``DATABASE_URL`` defaults to in-memory SQLite so importing ``app.main`` does not
require PostgreSQL client libraries or a running server. CI still installs
``psycopg2-binary`` for production-style checks when you override the URL.
"""

from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
