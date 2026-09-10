#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" -eq 0 ]] || { printf 'Ejecutar como root.\n' >&2; exit 1; }
CONFIG_FILE="${TURN0X_KIOSK_CONFIG:-/etc/turnox/kiosk.conf}"
set -a
# shellcheck disable=SC1090
. "$CONFIG_FILE"
set +a

[[ -n "${TURN0X_HOSTNAME:-}" ]] || { printf 'TURN0X_HOSTNAME está vacío.\n' >&2; exit 1; }
[[ "$TURN0X_HOSTNAME" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]$ ]] || { printf 'Hostname inválido.\n' >&2; exit 1; }

current="$(hostnamectl --static 2>/dev/null || true)"
if [[ "$current" == "$TURN0X_HOSTNAME" ]]; then
  printf 'Hostname ya configurado: %s\n' "$current"
  exit 0
fi

hostnamectl set-hostname "$TURN0X_HOSTNAME"
printf 'Hostname configurado: %s\n' "$TURN0X_HOSTNAME"
