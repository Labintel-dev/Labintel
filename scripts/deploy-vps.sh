#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/labintel}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-./backend/.env.production}"

cd "$APP_DIR"

echo "Deploying branch: $DEPLOY_BRANCH"
git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
  echo "Missing backend env file: $BACKEND_ENV_FILE"
  echo "Create it from backend/.env.production.example on the VPS and rerun deployment."
  exit 1
fi

export BACKEND_ENV_FILE
export APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD)}"

docker compose version
docker compose build --pull
docker compose up -d --remove-orphans
docker compose ps
docker image prune -f

echo "Deployment finished for $APP_VERSION"
