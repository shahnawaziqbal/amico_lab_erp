#!/usr/bin/env python3
"""AMICO Lab ERP RBAC migration verification.

This tool never modifies the source database.
It applies the RBAC migration only to a temporary SQLite copy.
"""

import argparse
from collections import Counter
from pathlib import Path
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE = ROOT / ".local-data/amico_erp.sqlite"
MIGRATION = ROOT / "backend/migrations/0001_rbac_foundation.sql"

REQUIRED_TABLES = {
    "user_profiles",
    "roles",
    "permissions",
    "user_roles",
    "role_permissions",
    "audit_logs",
    "schema_migrations",
}

def snapshot_violations(connection):
    return Counter(
        tuple(row)
        for row in connection.execute("PRAGMA foreign_key_check")
    )

def verify(source_path):
    if not source_path.is_file():
        raise RuntimeError("Source SQLite database not found.")
    if not MIGRATION.is_file():
        raise RuntimeError("RBAC migration file not found.")

    with tempfile.TemporaryDirectory(prefix="amico-rbac-test-") as tmp:
        target_path = Path(tmp) / "test.sqlite"

        with sqlite3.connect(
            source_path.resolve().as_uri() + "?mode=ro",
            uri=True,
        ) as source:
            with sqlite3.connect(target_path) as target:
                source.backup(target)

        with sqlite3.connect(target_path) as db:
            db.execute("PRAGMA foreign_keys=ON")

            baseline = snapshot_violations(db)
            users_before = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            existing_tables = {
                row[0]
                for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }

            if REQUIRED_TABLES & existing_tables:
                raise RuntimeError(
                    "Source already contains RBAC migration tables. "
                    "This initial-migration verifier expects a pre-migration database."
                )

            db.executescript(MIGRATION.read_text(encoding="utf-8"))

            tables_after = {
                row[0]
                for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }

            if not REQUIRED_TABLES.issubset(tables_after):
                raise RuntimeError("One or more RBAC tables are missing.")

            version = db.execute(
                "SELECT COUNT(*) FROM schema_migrations WHERE version=?",
                ("0001_rbac_foundation",),
            ).fetchone()[0]

            if version != 1:
                raise RuntimeError("Migration version was not registered.")

            users_after = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            if users_before != users_after:
                raise RuntimeError("Existing user count changed.")

            after = snapshot_violations(db)
            if after != baseline:
                raise RuntimeError(
                    "Foreign key violation baseline changed."
                )

            try:
                db.execute(
                    "INSERT INTO user_roles(user_id, role_id) "
                    "VALUES (?, ?)",
                    (999999999, 999999999),
                )
            except sqlite3.IntegrityError:
                pass
            else:
                raise RuntimeError("RBAC foreign key protection failed.")

            if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise RuntimeError("SQLite structural check failed.")

            print("PASS: Migration applied to temporary copy.")
            print("PASS: Required RBAC tables verified.")
            print("PASS: Migration version registered.")
            print("PASS: Existing users preserved.")
            print("PASS: Foreign key protection enforced.")
            print("Baseline FK violations:", sum(baseline.values()))
            print("New FK violations: 0")
            print("PASS: SQLite quick_check.")
            print("Source database unchanged.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "mode", choices=["verify"],
        help="Only temporary-copy verification is supported.",
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DATABASE,
    )
    args = parser.parse_args()

    if args.mode == "verify":
        verify(args.database)

if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, sqlite3.Error) as error:
        print("FAILED:", error, file=sys.stderr)
        sys.exit(1)
