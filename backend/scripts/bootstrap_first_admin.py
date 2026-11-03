#!/usr/bin/env python3
"""One-time bootstrap of the first real AMICO ERP SUPER_ADMIN."""
import argparse
import getpass
import json
import re
import secrets
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
WORKING_DB = (ROOT / ".local-data/amico_erp.sqlite").resolve()

def bcrypt_hash(password):
    javascript = """
const fs = require('fs');
const bcrypt = require('bcrypt');
const password = fs.readFileSync(0, 'utf8');
process.stdout.write(bcrypt.hashSync(password, 12));
"""
    result = subprocess.run(
        ["node", "-e", javascript],
        cwd=BACKEND,
        input=password,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout

def bcrypt_verify(password, digest):
    javascript = """
const fs = require('fs');
const bcrypt = require('bcrypt');
const password = fs.readFileSync(0, 'utf8');
const hash = process.argv[1];
process.stdout.write(String(bcrypt.compareSync(password, hash)));
"""
    result = subprocess.run(
        ["node", "-e", javascript, digest],
        cwd=BACKEND,
        input=password,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout == "true"

def inspect(db):
    db.execute("PRAGMA foreign_keys=ON")
    required = {
        "users", "user_profiles", "user_roles",
        "roles", "audit_logs", "schema_migrations",
    }
    available = {
        row[0] for row in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
    }
    if not required <= available:
        raise RuntimeError("Required RBAC tables are missing.")

    columns = {
        row[1] for row in db.execute(
            "PRAGMA table_info(user_profiles)"
        )
    }
    if "auth_version" not in columns:
        raise RuntimeError("Authentication-version column missing.")

    if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
        raise RuntimeError("Database integrity check failed.")

    role = db.execute(
        "SELECT id FROM roles WHERE code='SUPER_ADMIN'"
    ).fetchone()
    if not role:
        raise RuntimeError("SUPER_ADMIN role missing.")

    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    return int(role[0]), int(count)

def bootstrap(db_path, username, full_name, email, password):
    if not re.fullmatch(r"[A-Za-z0-9._@-]{3,100}", username):
        raise ValueError("Invalid username.")
    if not 2 <= len(full_name.strip()) <= 150:
        raise ValueError("Invalid full name.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise ValueError("Invalid email.")
    if not 8 <= len(password.encode("utf-8")) <= 128:
        raise ValueError("Password must be 8-128 UTF-8 bytes.")

    digest = bcrypt_hash(password)

    db = sqlite3.connect(str(db_path), timeout=10)
    try:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("BEGIN IMMEDIATE")

        role_id, count = inspect(db)

        if count != 0:
            raise RuntimeError(
                "Bootstrap refused: one or more user accounts exist."
            )

        # Fail closed until migration-history reconciliation
        # has been completed by the migration workflow.
        registered = db.execute(
            "SELECT COUNT(*) FROM schema_migrations "
            "WHERE version='0002_account_auth_version'"
        ).fetchone()[0]
        if registered != 1:
            raise RuntimeError(
                "Migration 0002 is not registered. "
                "Reconcile migration history before bootstrap."
            )

        cursor = db.execute(
            "INSERT INTO users(username,password,role) "
            "VALUES (?,?,'Administrator')",
            (username, digest),
        )
        user_id = cursor.lastrowid

        db.execute(
            "INSERT INTO user_profiles "
            "(user_id,full_name,email,status,auth_version) "
            "VALUES (?,?,?,'ACTIVE',0)",
            (user_id, full_name.strip(), email.lower(),),
        )
        db.execute(
            "INSERT INTO user_roles(user_id,role_id) VALUES (?,?)",
            (user_id, role_id),
        )
        db.execute(
            "INSERT INTO audit_logs "
            "(actor_user_id,action,target_type,target_id,metadata) "
            "VALUES (?,'INITIAL_ADMIN_BOOTSTRAPPED','USER',?,?)",
            (
                user_id,
                str(user_id),
                json.dumps({"role": "SUPER_ADMIN", "method": "local_bootstrap"}),
            ),
        )

        db.commit()
        return user_id
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def self_test():
    if not WORKING_DB.is_file():
        raise RuntimeError("Private source database missing.")

    with tempfile.TemporaryDirectory(prefix="amico-bootstrap-test-") as folder:
        test_db = Path(folder) / "disposable.sqlite"

        with sqlite3.connect(
            WORKING_DB.as_uri() + "?mode=ro", uri=True,
        ) as original:
            with sqlite3.connect(test_db) as copy:
                original.backup(copy)

        with sqlite3.connect(test_db) as db:
            role, count = inspect(db)
            if count != 0:
                raise RuntimeError("Expected zero existing accounts.")

            print("PASS: Disposable DB and seeded role verified.")

            # Reconcile the migration marker ONLY in this disposable copy.
            registered = db.execute(
                "SELECT COUNT(*) FROM schema_migrations "
                "WHERE version='0002_account_auth_version'"
            ).fetchone()[0]

            if registered == 0:
                db.execute(
                    "INSERT INTO schema_migrations(version) "
                    "VALUES ('0002_account_auth_version')"
                )
                db.commit()
            elif registered != 1:
                raise RuntimeError("Duplicate migration registrations.")

        password = secrets.token_urlsafe(25)
        user_id = bootstrap(
            test_db,
            "bootstrap_test_admin",
            "Bootstrap Test Administrator",
            "bootstrap-admin@example.test",
            password,
        )

        with sqlite3.connect(test_db) as db:
            record = db.execute(
                "SELECT u.password, p.status, p.auth_version, "
                "r.code FROM users u "
                "JOIN user_profiles p ON p.user_id=u.id "
                "JOIN user_roles ur ON ur.user_id=u.id "
                "JOIN roles r ON r.id=ur.role_id "
                "WHERE u.id=?",
                (user_id,),
            ).fetchone()

            if not record:
                raise RuntimeError("Bootstrapped account not found.")

            digest, status, version, code = record
            if (
                status != "ACTIVE"
                or version != 0
                or code != "SUPER_ADMIN"
                or not bcrypt_verify(password, digest)
                or digest == password
            ):
                raise RuntimeError("Account verification failed.")

            audit = db.execute(
                "SELECT COUNT(*) FROM audit_logs "
                "WHERE action='INITIAL_ADMIN_BOOTSTRAPPED' "
                "AND target_id=?",
                (str(user_id),),
            ).fetchone()[0]
            if audit != 1:
                raise RuntimeError("Bootstrap audit entry missing.")

        print("PASS: Test administrator created with bcrypt password.")
        print("PASS: ACTIVE profile and SUPER_ADMIN role assigned.")
        print("PASS: Exactly one bootstrap audit record created.")

        try:
            bootstrap(
                test_db, "second_admin", "Second Administrator",
                "second@example.test", secrets.token_urlsafe(25),
            )
        except RuntimeError as error:
            if "one or more user accounts exist" not in str(error):
                raise
            print("PASS: Second bootstrap attempt refused.")
        else:
            raise RuntimeError("Duplicate bootstrap was accepted.")

        with sqlite3.connect(test_db) as db:
            count = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]
            if count != 1:
                raise RuntimeError("Duplicate prevention failed.")

        print("PASS: Exactly one user remains in disposable DB.")

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--self-test", action="store_true")
    group.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    if not WORKING_DB.is_file():
        raise RuntimeError("Private working database missing.")

    with sqlite3.connect(
        WORKING_DB.as_uri() + "?mode=ro", uri=True,
    ) as db:
        _, count = inspect(db)
        if count != 0:
            raise RuntimeError(
                "Bootstrap refused: user accounts already exist."
            )

        registered = db.execute(
            "SELECT COUNT(*) FROM schema_migrations "
            "WHERE version='0002_account_auth_version'"
        ).fetchone()[0]

        if registered != 1:
            raise RuntimeError("Migration 0002 is not registered.")

    print("Initial SUPER_ADMIN setup for private development database.")
    print("Only one real administrator account will be created.")

    username = input("Administrator username: ").strip()
    full_name = input("Administrator full name: ").strip()
    email = input("Administrator email: ").strip().lower()

    password = getpass.getpass(
        "New password (8-128 UTF-8 bytes): "
    )
    confirmation = getpass.getpass("Confirm new password: ")

    if not secrets.compare_digest(password, confirmation):
        raise ValueError("Passwords do not match.")

    if not 8 <= len(password.encode("utf-8")) <= 128:
        raise ValueError("Password must be 8-128 UTF-8 bytes.")

    approval = input(
        "Type CREATE FIRST ADMIN to authorize insertion: "
    )

    if approval != "CREATE FIRST ADMIN":
        raise RuntimeError("Bootstrap cancelled.")

    from datetime import datetime

    backup_dir = ROOT / ".local-data/backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    backup_path = backup_dir / f"before-first-admin-{stamp}.sqlite"

    if backup_path.exists():
        raise RuntimeError("Backup destination already exists.")

    with sqlite3.connect(
        WORKING_DB.as_uri() + "?mode=ro", uri=True,
    ) as source:
        with sqlite3.connect(backup_path) as destination:
            source.backup(destination)

    with sqlite3.connect(
        backup_path.as_uri() + "?mode=ro", uri=True,
    ) as db:
        if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise RuntimeError("Bootstrap backup verification failed.")

    print("PASS: Verified pre-bootstrap database backup.")
    print("Backup:", backup_path.relative_to(ROOT))

    user_id = bootstrap(
        WORKING_DB, username, full_name, email, password,
    )

    with sqlite3.connect(
        WORKING_DB.as_uri() + "?mode=ro", uri=True,
    ) as db:
        row = db.execute(
            "SELECT p.status,p.auth_version,r.code "
            "FROM user_profiles p "
            "JOIN user_roles ur ON ur.user_id=p.user_id "
            "JOIN roles r ON r.id=ur.role_id "
            "WHERE p.user_id=?",
            (user_id,),
        ).fetchone()

        if row != ("ACTIVE", 0, "SUPER_ADMIN"):
            raise RuntimeError(
                "Administrator verification failed. "
                "Review database and backup before retrying."
            )

    print("PASS: First real administrator created and verified.")
    print("Administrator ID:", user_id)
    print("PASS: SUPER_ADMIN role and ACTIVE profile.")
    print("Password: [NOT DISPLAYED]")

if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, sqlite3.Error, subprocess.CalledProcessError) as error:
        raise SystemExit(f"STOP: {error}")
