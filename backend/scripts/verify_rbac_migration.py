from pathlib import Path
from collections import Counter
import sqlite3
import tempfile
import sys

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / ".local-data/amico_erp.sqlite"
MIGRATION = ROOT / "backend/migrations/0001_rbac_foundation.sql"

REQUIRED = {
    "user_profiles",
    "roles",
    "permissions",
    "user_roles",
    "role_permissions",
    "audit_logs",
    "schema_migrations",
}

def fk_violations(db):
    return Counter(
        tuple(row) for row in db.execute("PRAGMA foreign_key_check")
    )

def verify():
    if not SOURCE.is_file() or not MIGRATION.is_file():
        raise RuntimeError("Private database or migration missing.")

    with tempfile.TemporaryDirectory(prefix="amico-rbac-") as temp:
        target = Path(temp) / "verification.sqlite"

        with sqlite3.connect(
            f"file:{SOURCE}?mode=ro", uri=True
        ) as original:
            with sqlite3.connect(target) as copy:
                original.backup(copy)

        with sqlite3.connect(target) as db:
            db.execute("PRAGMA foreign_keys=ON")

            before = fk_violations(db)
            users_before = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            db.executescript(MIGRATION.read_text())

            tables = {
                row[0]
                for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }

            if not REQUIRED.issubset(tables):
                raise RuntimeError("Required RBAC tables missing.")

            version = db.execute(
                "SELECT COUNT(*) FROM schema_migrations WHERE version=?",
                ("0001_rbac_foundation",)
            ).fetchone()[0]

            if version != 1:
                raise RuntimeError("Migration registration missing.")

            users_after = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            if users_after != users_before:
                raise RuntimeError("Existing users changed.")

            after = fk_violations(db)

            if after != before:
                raise RuntimeError(
                    "Foreign key violations changed after migration."
                )

            try:
                db.execute(
                    "INSERT INTO user_roles(user_id, role_id) "
                    "VALUES (?, ?)",
                    (999999999, 999999999)
                )
            except sqlite3.IntegrityError:
                pass
            else:
                raise RuntimeError("RBAC foreign keys not enforced.")

            if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise RuntimeError("SQLite quick_check failed.")

            print("PASS: RBAC migration applied to temporary copy.")
            print("PASS: Seven RBAC tables verified.")
            print("PASS: Existing user count preserved.")
            print("PASS: Migration version registered.")
            print("PASS: RBAC foreign key enforcement.")
            print("PASS: Existing FK violation baseline unchanged.")
            print("Baseline FK violations:", sum(before.values()))
            print("New FK violations: 0")
            print("PASS: SQLite quick_check.")
            print("Working database not modified.")

if __name__ == "__main__":
    try:
        verify()
    except (sqlite3.Error, OSError, RuntimeError) as error:
        print("FAILED:", error, file=sys.stderr)
        sys.exit(1)
