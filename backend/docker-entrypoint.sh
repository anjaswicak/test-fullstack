#!/bin/sh
set -e

# 1) Generate .env from environment variables if not present
if [ ! -f ./.env ]; then
  echo "[entrypoint] Generating .env from environment variables (with safe defaults)"
  cat > ./.env <<EOF
PORT=${PORT:-3001}
CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3000}

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-anjaswicaksana}
DB_PASSWORD=${DB_PASSWORD:-passforpgsql}
DB_DATABASE=${DB_DATABASE:-test_fullstack}

ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET:-youraccesstokensecret}
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET:-yourrefreshtokensecret}
ACCESS_TOKEN_LIFE=${ACCESS_TOKEN_LIFE:-15m}
REFRESH_TOKEN_LIFE=${REFRESH_TOKEN_LIFE:-7d}
EOF
fi

# 2) Optionally run migrations/seeds
if [ "$RUN_MIGRATIONS" = "true" ]; then
  npx knex migrate:latest || true
fi
if [ "$RUN_SEEDS" = "true" ]; then
  npx knex seed:run || true
fi

# 3) Run the main command
exec "$@"
