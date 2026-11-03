#!/usr/bin/env python3
"""Verify AMICO ERP RBAC seed data on a disposable SQLite copy.

No mode in this script writes to the source development database.
"""

from pathlib import Path
from collections import Counter
import argparse
import re
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "backend/src/users/permissions/permission-catalog.ts"
DEFAULT_DB = ROOT / ".local-data/amico_erp.sqlite"

EXPECTED_TABLES = {
    "roles", "permissions", "user_roles",
    "role_permissions", "schema_migrations",
}

def parse_catalog():
    text = CATALOG.read_text(encoding="utf-8")

    match = re.search(
        r"export const PERMISSION_CODES = \[(.*?)\] as const;",
        text,
        re.S,
    )
    if not match:
        raise RuntimeError("Permission catalog structure not recognized.")

    def read_strings(block):
        clean = re.sub(r"'[^']*'", "", block)
        if re.sub(r"[\s,]", "", clean):
            raise RuntimeError("Unexpected expression in catalog.")
        return re.findall(r"'([^']+)'", block)

    permissions = read_strings(match.group(1))

    role_block = re.search(
        r"export const ROLE_TEMPLATES:\s*"
        r"Record<string,\s*readonly PermissionCode\[\]>\s*=\s*\{"
        r"(.*?)\n\};",
        text,
        re.S,
    )
    if not role_block:
        raise RuntimeError("Role catalog structure not recognized.")

    roles = {}
    role_pattern = re.compile(
        r"^\s{2}([A-Z][A-Z0-9_]*):\s*\[(.*?)\],",
        re.M | re.S,
    )
    for item in role_pattern.finditer(role_block.group(1)):
        name = item.group(1)
        if name in roles:
            raise RuntimeError("Duplicate role template.")
        roles[name] = read_strings(item.group(2))

    if len(permissions) != 53 or len(roles) != 13:
        raise RuntimeError(
            f"Unexpected catalog size: {len(permissions)} "
            f"permissions, {len(roles)} roles."
        )

    if len(permissions) != len(set(permissions)):
        raise RuntimeError("Duplicate permission code.")

    all_permissions = set(permissions)

    for role, codes in roles.items():
        if len(codes) != len(set(codes)):
            raise RuntimeError(f"Duplicate grant in {role}.")
        if not set(codes).issubset(all_permissions):
            raise RuntimeError(f"Invalid grant in {role}.")

    if "SUPER_ADMIN" not in roles or "AUDITOR" not in roles:
        raise RuntimeError("Mandatory role templates missing.")

    return permissions, roles

def foreign_key_violations(db):
    return Counter(
        tuple(row)
        for row in db.execute("PRAGMA foreign_key_check")
    )

def seed(db, permissions, roles):
    for code in permissions:
        db.execute(
            "INSERT INTO permissions(code, description) VALUES (?, ?)",
            (code, "ERP permission: " + code),
        )

    for role, codes in roles.items():
        db.execute(
            "INSERT INTO roles(code, name, description, is_system) "
            "VALUES (?, ?, ?, 1)",
            (role, role.replace("_", " ").title(),
             "System RBAC role template"),
        )

        role_id = db.execute(
            "SELECT id FROM roles WHERE code = ?",
            (role,),
        ).fetchone()[0]

        for code in codes:
            db.execute(
                "INSERT INTO role_permissions(role_id, permission_id) "
                "SELECT ?, id FROM permissions WHERE code = ?",
                (role_id, code),
            )

def verify(source):
    permissions, roles = parse_catalog()

    if not source.is_file():
        raise RuntimeError("Private database missing.")

    with tempfile.TemporaryDirectory(prefix="amico-rbac-seed-") as temp:
        target = Path(temp) / "seed-test.sqlite"

        with sqlite3.connect(
            source.resolve().as_uri() + "?mode=ro", uri=True
        ) as original:
            with sqlite3.connect(target) as copy:
                original.backup(copy)

        with sqlite3.connect(target) as db:
            db.execute("PRAGMA foreign_keys=ON")

            tables = {
                row[0] for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }
            if not EXPECTED_TABLES.issubset(tables):
                raise RuntimeError("RBAC migration is not installed.")

            version = db.execute(
                "SELECT COUNT(*) FROM schema_migrations "
                "WHERE version='0001_rbac_foundation'"
            ).fetchone()[0]
            if version != 1:
                raise RuntimeError("RBAC migration version missing.")

            for table in ("roles", "permissions", "role_permissions"):
                count = db.execute(
                    f'SELECT COUNT(*) FROM "{table}"'
                ).fetchone()[0]
                if count != 0:
                    raise RuntimeError(
                        f"{table} is not empty; seed verification expects "
                        "an unseeded database."
                    )

            baseline = foreign_key_violations(db)
            users_before = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            db.execute("BEGIN IMMEDIATE")
            seed(db, permissions, roles)

            permission_count = db.execute(
                "SELECT COUNT(*) FROM permissions"
            ).fetchone()[0]
            role_count = db.execute(
                "SELECT COUNT(*) FROM roles"
            ).fetchone()[0]
            assignment_count = db.execute(
                "SELECT COUNT(*) FROM role_permissions"
            ).fetchone()[0]

            if permission_count != len(permissions):
                raise RuntimeError("Permission seed count mismatch.")
            if role_count != len(roles):
                raise RuntimeError("Role seed count mismatch.")
            if assignment_count != sum(map(len, roles.values())):
                raise RuntimeError("Role permission assignments mismatch.")

            for role, codes in roles.items():
                actual = {
                    row[0] for row in db.execute(
                        "SELECT p.code FROM role_permissions rp "
                        "JOIN roles r ON r.id = rp.role_id "
                        "JOIN permissions p ON p.id = rp.permission_id "
                        "WHERE r.code = ?",
                        (role,),
                    )
                }
                if actual != set(codes):
                    raise RuntimeError(
                        f"Incorrect grants for role {role}."
                    )

            users_after = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            if users_after != users_before:
                raise RuntimeError("User records changed.")

            if foreign_key_violations(db) != baseline:
                raise RuntimeError("Foreign key baseline changed.")

            if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise RuntimeError("SQLite integrity check failed.")

            db.rollback()

            print("PASS: Parsed 53 permission codes.")
            print("PASS: Parsed 13 role templates.")
            print("PASS: All permission codes inserted into test copy.")
            print("PASS: All role templates inserted into test copy.")
            print("PASS: All role-permission assignments checked.")
            print("Role-permission assignments:", assignment_count)
            print("PASS: Existing users preserved.")
            print("Baseline FK violations:", sum(baseline.values()))
            print("New FK violations: 0")
            print("PASS: SQLite integrity check.")
            print("PASS: Test transaction rolled back.")
            print("PASS: Source database unchanged.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["verify"])
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()
    verify(args.database)

if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, sqlite3.Error) as error:
        print("FAILED:", error, file=sys.stderr)
        sys.exit(1)
