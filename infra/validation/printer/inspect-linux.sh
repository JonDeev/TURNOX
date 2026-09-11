#!/usr/bin/env bash
set -Eeuo pipefail

usage() { printf 'Uso: %s --device /dev/RUTA\n' "$0" >&2; }
device=''
while (($#)); do
  case "$1" in
    --device) [[ $# -ge 2 ]] || { usage; exit 2; }; device=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$device" ]] || { usage; exit 2; }
[[ -e "$device" ]] || { printf 'FAIL: no existe %s\n' "$device" >&2; exit 1; }
printf '%s\n' '--- lsusb (registrar salida sin modificar IDs) ---'
command -v lsusb >/dev/null 2>&1 && lsusb || printf 'INFO: lsusb no disponible\n'
printf '%s\n' '--- udev attributes ---'
udevadm info --query=all --name="$device"
printf '%s\n' '--- permissions ---'
stat --printf='path=%n mode=%a owner=%U group=%G\n' "$device"
printf '%s\n' '--- recent kernel messages (manual correlation required) ---'
dmesg --ctime --level=err,warn 2>/dev/null | tail -n 40 || true
