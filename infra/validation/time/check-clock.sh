#!/usr/bin/env bash
set -Eeuo pipefail

usage() { printf 'Uso: %s --config ARCHIVO\n' "$0" >&2; }
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
for variable in TURN0X_TIMEZONE TURN0X_NTP_SERVERS TURN0X_MAX_CLOCK_OFFSET_SECONDS; do
  [[ -n "${!variable:-}" ]] || { printf 'FAIL: falta %s\n' "$variable" >&2; exit 2; }
done
[[ "$TURN0X_MAX_CLOCK_OFFSET_SECONDS" =~ ^[0-9]+$ ]] || { printf 'FAIL: umbral inválido\n' >&2; exit 2; }

actual_zone=$(timedatectl show --property=Timezone --value)
sync_state=$(timedatectl show --property=NTPSynchronized --value)
printf 'CLOCK timezone=%s actual=%s ntp_synchronized=%s\n' "$TURN0X_TIMEZONE" "$actual_zone" "$sync_state"
timedatectl status --no-pager
[[ "$actual_zone" == "$TURN0X_TIMEZONE" ]] || { printf 'FAIL: zona horaria distinta\n' >&2; exit 1; }
[[ "$sync_state" == yes ]] || { printf 'FAIL: NTP no sincronizado\n' >&2; exit 1; }
command -v chronyc >/dev/null 2>&1 || {
  printf 'PENDIENTE: chronyc no está instalado; medir el desfase con la herramienta NTP administrada y conservar evidencia equivalente.\n' >&2
  exit 3
}
tracking=$(chronyc tracking)
sources=$(chronyc sources -n)
printf '%s\n' "$tracking"
printf '%s\n' "$sources"
system_offset=$(printf '%s\n' "$tracking" | awk '/^System time/ {print $4; exit}')
[[ "$system_offset" =~ ^-?[0-9]+([.][0-9]+)?$ ]] || {
  printf 'FAIL: no se pudo extraer el desfase de chrony\n' >&2
  exit 1
}
active_source=$(printf '%s\n' "$sources" | grep -E '^[[:space:]]*\^[*+]' || true)
[[ -n "$active_source" ]] || { printf 'FAIL: chrony no muestra una fuente activa\n' >&2; exit 1; }
within_limit=$(awk -v offset="$system_offset" -v limit="$TURN0X_MAX_CLOCK_OFFSET_SECONDS" \
  'BEGIN { if (offset < 0) offset = -offset; print (offset <= limit) ? "yes" : "no" }')
[[ "$within_limit" == yes ]] || {
  printf 'FAIL: desfase=%s segundos supera el umbral=%s\n' "$system_offset" "$TURN0X_MAX_CLOCK_OFFSET_SECONDS" >&2
  exit 1
}
printf 'PASS-CLOCK timezone=%s configured_ntp=%s max_offset_seconds=%s\n' \
  "$actual_zone" "$TURN0X_NTP_SERVERS" "$TURN0X_MAX_CLOCK_OFFSET_SECONDS"
