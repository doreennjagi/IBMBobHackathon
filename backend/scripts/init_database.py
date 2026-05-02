#!/usr/bin/env python3
"""
Database initialization entrypoint.

Run from the `backend/` directory after PostgreSQL is reachable:

    python scripts/init_database.py

This script applies all Alembic migrations to the database referenced by
``DATABASE_URL`` (or the default in ``app.core.config``). It does not seed data.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    backend_root = Path(__file__).resolve().parents[1]
    alembic_ini = backend_root / "alembic.ini"
    if not alembic_ini.is_file():
        print("Expected alembic.ini at", alembic_ini, file=sys.stderr)
        return 1

    cmd = [sys.executable, "-m", "alembic", "-c", str(alembic_ini), "upgrade", "head"]
    print("Running:", " ".join(cmd), "(cwd=", backend_root, ")")
    proc = subprocess.run(cmd, cwd=str(backend_root))
    return int(proc.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
