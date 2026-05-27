#!/bin/sh
set -eu

: "${ALLOYDB_HOST:?Missing ALLOYDB_HOST}"
: "${ALLOYDB_PORT:=5432}"
: "${ALLOYDB_DATABASE:?Missing ALLOYDB_DATABASE}"
: "${ALLOYDB_ADMIN_USER:=postgres}"
: "${ALLOYDB_ADMIN_PASSWORD:?Missing ALLOYDB_ADMIN_PASSWORD}"

export PGPASSWORD="$ALLOYDB_ADMIN_PASSWORD"

echo "Checking database: $ALLOYDB_DATABASE"

DB_EXISTS=$(psql \
  -h "$ALLOYDB_HOST" \
  -p "$ALLOYDB_PORT" \
  -U "$ALLOYDB_ADMIN_USER" \
  -d postgres \
  -Atc "SELECT 1 FROM pg_database WHERE datname='${ALLOYDB_DATABASE}'")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database: $ALLOYDB_DATABASE"
  psql \
    -h "$ALLOYDB_HOST" \
    -p "$ALLOYDB_PORT" \
    -U "$ALLOYDB_ADMIN_USER" \
    -d postgres \
    -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE ${ALLOYDB_DATABASE};"
else
  echo "Database already exists: $ALLOYDB_DATABASE"
fi

echo "Running SQL migrations..."

for file in /workspace/infra/sql/*.sql; do
  filename=$(basename "$file")

  if [ "$filename" = "000_create_database.sql" ]; then
    echo "Skipping $filename because database creation is handled by this job."
    continue
  fi

  echo "Running $filename"

  psql \
    -h "$ALLOYDB_HOST" \
    -p "$ALLOYDB_PORT" \
    -U "$ALLOYDB_ADMIN_USER" \
    -d "$ALLOYDB_DATABASE" \
    -v ON_ERROR_STOP=1 \
    -v APP_DB_PASSWORD="$APP_DB_PASSWORD" \
    -v LOADER_DB_PASSWORD="$LOADER_DB_PASSWORD" \
    -f "$file"
done

echo "Migrations completed."

echo "Installed extensions:"
psql \
  -h "$ALLOYDB_HOST" \
  -p "$ALLOYDB_PORT" \
  -U "$ALLOYDB_ADMIN_USER" \
  -d "$ALLOYDB_DATABASE" \
  -Atc "SELECT extname FROM pg_extension ORDER BY extname;"

echo "Schemas:"
psql \
  -h "$ALLOYDB_HOST" \
  -p "$ALLOYDB_PORT" \
  -U "$ALLOYDB_ADMIN_USER" \
  -d "$ALLOYDB_DATABASE" \
  -Atc "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('claims','rag','app') ORDER BY schema_name;"