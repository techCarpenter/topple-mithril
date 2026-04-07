#!/usr/bin/env bash

set -euo pipefail

if [ -f .env.deploy.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.deploy.local
  set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/srv/topple-mithril}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_SSH_KEY_PATH="${DEPLOY_SSH_KEY_PATH:-}"

if [ -z "${DEPLOY_HOST}" ]; then
  echo "DEPLOY_HOST is required" >&2
  exit 1
fi

if [ -z "${DEPLOY_USER}" ]; then
  echo "DEPLOY_USER is required" >&2
  exit 1
fi

SSH_ARGS=(
  -p "${DEPLOY_PORT}"
)

if [ -n "${DEPLOY_SSH_KEY_PATH}" ]; then
  SSH_ARGS+=(-i "${DEPLOY_SSH_KEY_PATH}")
fi

ssh "${SSH_ARGS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "cd '${DEPLOY_PATH}' && DEPLOY_BRANCH='${DEPLOY_BRANCH}' ./scripts/deploy-production.sh"
