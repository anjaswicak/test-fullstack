#!/bin/sh
set -e

# 1) Generate .env from environment variables if not present
if [ ! -f ./.env ]; then
  echo "[entrypoint] Generating .env from environment variables (with safe defaults)"

  # Generate secrets if not provided
  if [ -z "${ACCESS_TOKEN_SECRET}" ]; then
    ACCESS_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
    echo "[entrypoint] Generated ACCESS_TOKEN_SECRET"
  fi
  if [ -z "${REFRESH_TOKEN_SECRET}" ]; then
    REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))")
    echo "[entrypoint] Generated REFRESH_TOKEN_SECRET"
  fi

  cat > ./.env <<EOF
PORT=${PORT:-3001}
CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3000}

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_DATABASE=${DB_DATABASE:-fullstack_test}

ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET:-youraccesstokensecret}
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET:-yourrefreshtokensecret}
ACCESS_TOKEN_LIFE=${ACCESS_TOKEN_LIFE:-15m}
REFRESH_TOKEN_LIFE=${REFRESH_TOKEN_LIFE:-7d}
EOF
  # secure the .env file inside container
  chmod 600 ./.env || true
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
