#!/usr/bin/env bash
set -Eeuo pipefail

usage() { printf 'Uso: %s --serial SERIAL\n' "$0" >&2; }
serial=''
while (($#)); do
  case "$1" in
    --serial) [[ $# -ge 2 ]] || { usage; exit 2; }; serial=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$serial" ]] || { usage; exit 2; }
command -v adb >/dev/null 2>&1 || { printf 'FAIL: adb no está instalado\n' >&2; exit 2; }
printf '%s\n' 'ADB es una herramienta de validación autorizada; no equivale al mecanismo productivo de administración.'
adb -s "$serial" wait-for-device
printf '%s\n' '--- identity / OS ---'
adb -s "$serial" shell getprop ro.product.manufacturer
adb -s "$serial" shell getprop ro.product.model
adb -s "$serial" shell getprop ro.build.version.release
adb -s "$serial" shell getprop ro.build.version.sdk
printf '%s\n' '--- memory / storage ---'
adb -s "$serial" shell cat /proc/meminfo | sed -n '1,4p'
adb -s "$serial" shell df -h
printf '%s\n' '--- network / display ---'
adb -s "$serial" shell dumpsys ethernet 2>/dev/null || true
adb -s "$serial" shell wm size
adb -s "$serial" shell wm density
