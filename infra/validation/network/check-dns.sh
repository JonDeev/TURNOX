#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Uso: %s --config ARCHIVO\n' "$0" >&2
  printf 'TURN0X_DNS_NAMES: nombre|hostname|puerto separados por espacios.\n' >&2
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

[[ -n "${TURN0X_DNS_NAMES:-}" ]] || {
  printf 'FAIL: TURN0X_DNS_NAMES está vacío; no se inventa un nombre.\n' >&2
  exit 1
}

status=0
for item in $TURN0X_DNS_NAMES; do
  IFS='|' read -r label host port <<< "$item"
  [[ -n "${label:-}" && -n "${host:-}" && -n "${port:-}" ]] || {
    printf 'FAIL: entrada inválida: %s\n' "$item" >&2
    status=1
    continue
  }
  if ! [[ "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
    printf 'FAIL: puerto inválido para %s: %s\n' "$label" "$port" >&2
    status=1
    continue
  fi
  if addresses=$(getent ahosts "$host"); then
    printf 'PASS-DNS %s host=%s port=%s addresses=%s\n' \
      "$label" "$host" "$port" "$(printf '%s' "$addresses" | awk '{print $1}' | sort -u | tr '\n' ',')"
  else
    printf 'FAIL-DNS %s host=%s: sin resolución\n' "$label" "$host" >&2
    status=1
  fi
done
exit "$status"
