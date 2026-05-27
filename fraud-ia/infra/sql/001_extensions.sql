-- 001_extensions.sql
-- Enable required PostgreSQL extensions and create application schemas.
-- Run as superuser (postgres) against the fraudia database.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
CREATE EXTENSION IF NOT EXISTS google_ml_integration;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS claims;
CREATE SCHEMA IF NOT EXISTS rag;
CREATE SCHEMA IF NOT EXISTS app;
