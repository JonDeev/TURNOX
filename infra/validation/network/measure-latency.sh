#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Uso: %s --host HOSTNAME --count N --timeout-seconds N\n' "$0" >&2
}
host=''; count=''; timeout_seconds=''
while (($#)); do
  case "$1" in
    --host) [[ $# -ge 2 ]] || { usage; exit 2; }; host=$2; shift 2 ;;
    --count) [[ $# -ge 2 ]] || { usage; exit 2; }; count=$2; shift 2 ;;
    --timeout-seconds) [[ $# -ge 2 ]] || { usage; exit 2; }; timeout_seconds=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$host" && "$count" =~ ^[1-9][0-9]*$ && "$timeout_seconds" =~ ^[1-9][0-9]*$ ]] || {
  usage; exit 2;
}
getent ahosts "$host" >/dev/null || { printf 'FAIL-DNS host=%s\n' "$host" >&2; exit 1; }
printf 'LATENCY target=%s count=%s timeout_seconds=%s\n' "$host" "$count" "$timeout_seconds"
ping -n -c "$count" -W "$timeout_seconds" "$host"
