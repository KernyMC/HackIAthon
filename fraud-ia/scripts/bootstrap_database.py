#!/usr/bin/env python3
"""
Bootstrap AlloyDB: create database, schemas, tables, indexes, views and users.
Run with admin credentials. Safe to re-run (idempotent).
"""
import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).parent.parent
SQL_DIR = REPO_ROOT / "infra" / "sql"


def get_admin_url() -> str:
    host = os.environ.get("ALLOYDB_HOST", "localhost")
    port = os.environ.get("ALLOYDB_PORT", "5432")
    db = os.environ.get("ALLOYDB_ADMIN_DATABASE", "postgres")
    user = os.environ.get("ALLOYDB_ADMIN_USER", "postgres")
    password = os.environ.get("ALLOYDB_ADMIN_PASSWORD", "")
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{db}"


def get_target_url(database: str = "fraudia") -> str:
    host = os.environ.get("ALLOYDB_HOST", "localhost")
    port = os.environ.get("ALLOYDB_PORT", "5432")
    user = os.environ.get("ALLOYDB_ADMIN_USER", "postgres")
    password = os.environ.get("ALLOYDB_ADMIN_PASSWORD", "")
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{database}"


def create_database_if_not_exists():
    from sqlalchemy import create_engine, text

    engine = create_engine(get_admin_url(), isolation_level="AUTOCOMMIT")
    target_db = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :db"),
            {"db": target_db},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{target_db}"'))
            logger.info(f"Created database: {target_db}")
        else:
            logger.info(f"Database already exists: {target_db}")
    engine.dispose()


def run_sql_file(engine, filepath: Path):
    content = filepath.read_text(encoding="utf-8")
    from sqlalchemy import text

    with engine.begin() as conn:
        try:
            conn.execute(text(content))
            logger.info(f"Executed: {filepath.name}")
        except Exception as e:
            logger.warning(f"Non-fatal error in {filepath.name}: {e}")


def create_app_users(engine):
    from sqlalchemy import text

    app_password = os.environ.get("APP_DB_PASSWORD", os.environ.get("ALLOYDB_PASSWORD", "app_user_pass"))
    loader_password = os.environ.get("LOADER_DB_PASSWORD", "loader_user_pass")

    with engine.begin() as conn:
        for user, password in [("app_user", app_password), ("loader_user", loader_password)]:
            exists = conn.execute(
                text("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :u"),
                {"u": user},
            ).scalar()
            if not exists:
                conn.execute(text(f"CREATE USER {user} WITH PASSWORD '{password}'"))
                logger.info(f"Created user: {user}")
            else:
                conn.execute(text(f"ALTER USER {user} WITH PASSWORD '{password}'"))
                logger.info(f"Updated password for: {user}")

        # Grants
        for schema in ["claims", "rag", "app"]:
            conn.execute(text(f"GRANT USAGE ON SCHEMA {schema} TO app_user"))
            conn.execute(text(f"GRANT USAGE ON SCHEMA {schema} TO loader_user"))

        conn.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA claims TO app_user"))
        conn.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA rag TO app_user"))
        conn.execute(text("GRANT INSERT ON app.chat_sessions, app.chat_messages, app.agent_tool_calls TO app_user"))
        conn.execute(text("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user"))

        for schema in ["claims", "rag", "app"]:
            conn.execute(text(f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA {schema} TO loader_user"))
            conn.execute(text(f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA {schema} TO loader_user"))

        logger.info("Grants applied.")


def main():
    from sqlalchemy import create_engine

    logger.info("=== FraudIA Database Bootstrap ===")

    create_database_if_not_exists()

    target_db = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    engine = create_engine(get_target_url(target_db))

    for sql_file in sorted(SQL_DIR.glob("*.sql")):
        run_sql_file(engine, sql_file)

    create_app_users(engine)
    engine.dispose()
    logger.info("=== Bootstrap completed successfully ===")


if __name__ == "__main__":
    main()
