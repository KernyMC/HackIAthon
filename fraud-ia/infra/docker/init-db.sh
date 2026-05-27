#!/bin/bash
set -e

# Runs inside the postgres container on first boot.
# Creates users, extensions, schema, indexes, views, and grants.

APP_PASS="${ALLOYDB_PASSWORD:-app_user_pass}"
LOADER_PASS="${LOADER_PASSWORD:-loader_pass}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Extensions (pgvector)
    $(cat /docker-entrypoint-initdb.d/sql/001_extensions.sql)

    -- Schema (tables)
    $(cat /docker-entrypoint-initdb.d/sql/002_schema.sql)

    -- Also add missing columns that differ from CSV
    ALTER TABLE claims.proveedores ADD COLUMN IF NOT EXISTS casos_observados_ultimo_anio integer DEFAULT 0;
    ALTER TABLE claims.polizas ADD COLUMN IF NOT EXISTS id_vehiculo text;
    ALTER TABLE claims.narrativas_similares ALTER COLUMN cluster_narrativa TYPE text;

    -- Indexes
    $(cat /docker-entrypoint-initdb.d/sql/003_indexes.sql)

    -- Views
    $(cat /docker-entrypoint-initdb.d/sql/004_views.sql)

    -- Users
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
            CREATE USER app_user WITH PASSWORD '$APP_PASS';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'loader_user') THEN
            CREATE USER loader_user WITH PASSWORD '$LOADER_PASS';
        END IF;
    END
    \$\$;

    -- Full privileges for local dev (both users)
    GRANT USAGE ON SCHEMA claims, rag, app TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA claims TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rag TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA claims TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA rag TO app_user, loader_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO app_user, loader_user;
EOSQL

echo "FraudIA database initialized."
