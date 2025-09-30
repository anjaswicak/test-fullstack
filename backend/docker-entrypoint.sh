#!/bin/sh
set -e

# Load envs (already from .env) if present
# Run migrations and seeds if desired
if [ "$RUN_MIGRATIONS" = "true" ]; then
  npx knex migrate:latest || true
fi
if [ "$RUN_SEEDS" = "true" ]; then
  npx knex seed:run || true
fi

exec "$@"
