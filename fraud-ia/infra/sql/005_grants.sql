-- 005_grants.sql
-- Create application database users and assign least-privilege grants.
-- Run after 002_schema.sql (tables must exist before GRANTs are applied).
--
-- IMPORTANT: This script does NOT embed passwords.  Passwords are passed in
-- by the bootstrap script via environment variables or Secret Manager so that
-- no credentials appear in source control.
--
-- The bootstrap script (scripts/bootstrap_database.py) executes these
-- statements programmatically after substituting the passwords.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Create roles (idempotent)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    -- app_user: read-only on claims & rag, write on app (chat history)
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user'
    ) THEN
        CREATE USER app_user WITH PASSWORD 'PLACEHOLDER_APP_PASSWORD';
    END IF;

    -- loader_user: full DML on claims & rag for data loading and RAG ingestion
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'loader_user'
    ) THEN
        CREATE USER loader_user WITH PASSWORD 'PLACEHOLDER_LOADER_PASSWORD';
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Grants for app_user
-- Read access to claims and rag; write access to app session tables.
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA claims TO app_user;
GRANT USAGE ON SCHEMA rag    TO app_user;
GRANT USAGE ON SCHEMA app    TO app_user;

-- Read all existing tables in claims and rag
GRANT SELECT ON ALL TABLES IN SCHEMA claims TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA rag    TO app_user;

-- Write access for chat session data
GRANT INSERT ON app.chat_sessions      TO app_user;
GRANT INSERT ON app.chat_messages      TO app_user;
GRANT INSERT ON app.agent_tool_calls   TO app_user;

-- Sequence usage for auto-increment PKs in app schema
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;

-- Ensure future tables in claims and rag are also readable by app_user
ALTER DEFAULT PRIVILEGES IN SCHEMA claims
    GRANT SELECT ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA rag
    GRANT SELECT ON TABLES TO app_user;

-- ---------------------------------------------------------------------------
-- Grants for loader_user
-- Full DML on claims and rag for CSV loading and RAG ingestion.
-- No access to app schema (avoids touching live session data).
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA claims TO loader_user;
GRANT USAGE ON SCHEMA rag    TO loader_user;
GRANT USAGE ON SCHEMA app    TO loader_user;

-- Full DML on claims (load and refresh synthetic data)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA claims TO loader_user;

-- Full DML on rag (ingest and re-index business knowledge)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rag TO loader_user;

-- Sequence usage for BIGSERIAL PKs in rag and app
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rag  TO loader_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app  TO loader_user;

-- Ensure future tables in claims and rag are also accessible by loader_user
ALTER DEFAULT PRIVILEGES IN SCHEMA claims
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO loader_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA rag
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO loader_user;
