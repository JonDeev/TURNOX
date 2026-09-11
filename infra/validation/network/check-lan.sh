#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Uso: %s --config ARCHIVO\n' "$0" >&2
  printf 'TURN0X_LAN_TARGETS: nombre|hostname|puerto separados por espacios.\n' >&2
}

config=''
while (($#)); do
  case "$1" in
    --config) [[ $# -ge 2 ]] || { usage; exit 2; }; config=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$config" && -r "$config" ]] || { usage; exit 2; }
# shellcheck disable=SC1090
source "$config"

for variable in TURN0X_LAN_TARGETS TURN0X_PING_COUNT TURN0X_PING_TIMEOUT_SECONDS TURN0X_TCP_TIMEOUT_SECONDS; do
  [[ -n "${!variable:-}" ]] || { printf 'FAIL: falta %s\n' "$variable" >&2; exit 2; }
done
[[ "$TURN0X_PING_COUNT" =~ ^[1-9][0-9]*$ ]] || { printf 'FAIL: conteo ping inválido\n' >&2; exit 2; }
[[ "$TURN0X_PING_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] || { printf 'FAIL: timeout ping inválido\n' >&2; exit 2; }
[[ "$TURN0X_TCP_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] || { printf 'FAIL: timeout TCP inválido\n' >&2; exit 2; }

status=0
for item in $TURN0X_LAN_TARGETS; do
  IFS='|' read -r label host port <<< "$item"
  if [[ -z "${label:-}" || -z "${host:-}" || -z "${port:-}" ]] ||
     ! [[ "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
    printf 'FAIL: entrada inválida: %s\n' "$item" >&2
    status=1
    continue
  fi

  if ! getent ahosts "$host" >/dev/null; then
    printf 'FAIL-DNS %s host=%s\n' "$label" "$host" >&2
    status=1
    continue
  fi
  ping_output=$(mktemp)
  if ping -n -c "$TURN0X_PING_COUNT" -W "$TURN0X_PING_TIMEOUT_SECONDS" "$host" \
      >"$ping_output" 2>&1; then
    printf 'PASS-PING %s host=%s\n' "$label" "$host"
  else
    printf 'FAIL-PING %s host=%s\n' "$label" "$host" >&2
    status=1
  fi
  rm -f "$ping_output"

  if timeout "$TURN0X_TCP_TIMEOUT_SECONDS" env TARGET_HOST="$host" TARGET_PORT="$port" \
      bash -c 'exec 3<>"/dev/tcp/${TARGET_HOST}/${TARGET_PORT}"'; then
    printf 'PASS-TCP %s host=%s port=%s\n' "$label" "$host" "$port"
  else
    printf 'FAIL-TCP %s host=%s port=%s\n' "$label" "$host" "$port" >&2
    status=1
  fi
done
exit "$status"
