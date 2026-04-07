#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NODE_ENV="${NODE_ENV:-production}"
DATA_DIR="${DATA_DIR:-${PROJECT_ROOT}/data}"
DEFAULT_DB_FILE="${DATA_DIR}/topple-$([ "${NODE_ENV}" = "production" ] && printf 'prod' || printf 'dev').db"
DB_FILE="${DB_FILE:-${DEFAULT_DB_FILE}}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
DB_BASENAME="$(basename "${DB_FILE}")"
BACKUP_BASENAME="${DB_BASENAME%.db}-${TIMESTAMP}.db"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_BASENAME}"
COMPRESSED_BACKUP_PATH="${BACKUP_PATH}.gz"
INTEGRITY_RESULT=""

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required but was not found in PATH" >&2
  exit 1
fi

if [ ! -f "${DB_FILE}" ]; then
  echo "Database file not found: ${DB_FILE}" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

sqlite3 "${DB_FILE}" ".backup '${BACKUP_PATH}'"

INTEGRITY_RESULT="$(sqlite3 "${BACKUP_PATH}" "PRAGMA integrity_check;")"
if [ "${INTEGRITY_RESULT}" != "ok" ]; then
  echo "Backup integrity check failed: ${INTEGRITY_RESULT}" >&2
  rm -f "${BACKUP_PATH}"
  exit 1
fi

gzip -f "${BACKUP_PATH}"

find "${BACKUP_DIR}" -maxdepth 1 -type f -name "${DB_BASENAME%.db}-*.db.gz" -mtime "+${BACKUP_RETENTION_DAYS}" -delete

echo "Created backup: ${COMPRESSED_BACKUP_PATH}"
