#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-20}"
HEALTHCHECK_SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-2}"

cd "${PROJECT_ROOT}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://${HOST}:${PORT}/api/v1/}"

if [ ! -d .git ]; then
  echo "Expected a git checkout at ${PROJECT_ROOT}" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but was not found in PATH" >&2
  exit 1
fi

git fetch origin "${DEPLOY_BRANCH}"

if git show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}"; then
  git checkout "${DEPLOY_BRANCH}"
else
  git checkout -b "${DEPLOY_BRANCH}" --track "origin/${DEPLOY_BRANCH}"
fi

git pull --ff-only origin "${DEPLOY_BRANCH}"

npm ci
npm run build

if sudo -n systemctl list-unit-files topple-backup.service >/dev/null 2>&1; then
  sudo -n systemctl start topple-backup.service
fi

sudo -n systemctl restart topple.service

for _ in $(seq 1 "${HEALTHCHECK_RETRIES}"); do
  if curl --fail --silent --show-error "${HEALTHCHECK_URL}" >/dev/null; then
    echo "Deployment succeeded and health check passed: ${HEALTHCHECK_URL}"
    exit 0
  fi

  sleep "${HEALTHCHECK_SLEEP_SECONDS}"
done

echo "Deployment completed but health check did not pass: ${HEALTHCHECK_URL}" >&2
exit 1
