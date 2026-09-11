#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Uso: %s --device /dev/RUTA --text TEXTO [--encoding DESCRIPCION]\n' "$0" >&2
  printf 'La ruta debe ser proporcionada por la validación de la unidad; nunca se autodetecta.\n' >&2
}
device=''; text=''; encoding='UTF-8 según configuración real de la impresora'
while (($#)); do
  case "$1" in
    --device) [[ $# -ge 2 ]] || { usage; exit 2; }; device=$2; shift 2 ;;
    --text) [[ $# -ge 2 ]] || { usage; exit 2; }; text=$2; shift 2 ;;
    --encoding) [[ $# -ge 2 ]] || { usage; exit 2; }; encoding=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[[ -n "$device" && -n "$text" ]] || { usage; exit 2; }
[[ -c "$device" || -p "$device" ]] || { printf 'FAIL: no es un dispositivo de caracteres/pipe: %s\n' "$device" >&2; exit 1; }
[[ -w "$device" ]] || { printf 'FAIL: sin permiso de escritura: %s\n' "$device" >&2; exit 1; }

printf 'ESC_POS device=%s encoding=%s\n' "$device" "$encoding"
printf '\033@\033a\001TURNOX ESC/POS\n\033a\000%s\n\n\033d\003\033i' "$text" > "$device"
printf 'PASS-TRANSMISSION: bytes enviados; validar físicamente texto, codificación, avance y corte.\n'
