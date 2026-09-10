#!/usr/bin/env bash
set -Eeuo pipefail

CONFIG_FILE="${TURN0X_KIOSK_CONFIG:-/etc/turnox/kiosk.conf}"

die() {
  printf 'turnox-kiosk: ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -r "$CONFIG_FILE" ]] || die "no se puede leer la configuración: $CONFIG_FILE"

config_owner="$(stat -c '%U' "$CONFIG_FILE" 2>/dev/null || true)"
config_mode="$(stat -c '%a' "$CONFIG_FILE" 2>/dev/null || true)"
[[ "$config_owner" == root ]] || die 'la configuración debe pertenecer a root'
[[ "$config_mode" == 640 || "$config_mode" == 600 ]] || die 'la configuración debe tener modo 0640 o 0600'

# La configuración es administrada por root; se carga solo como datos de entorno.
set -a
# shellcheck disable=SC1090
. "$CONFIG_FILE"
set +a

[[ -n "${TURN0X_KIOSK_URL:-}" ]] || die 'TURN0X_KIOSK_URL está vacío'
[[ "$TURN0X_KIOSK_URL" == https://* ]] || die 'TURN0X_KIOSK_URL debe usar HTTPS'
[[ "$TURN0X_KIOSK_URL" != *' '* ]] || die 'TURN0X_KIOSK_URL no puede contener espacios'
[[ -n "${TURN0X_HOSTNAME:-}" ]] || die 'TURN0X_HOSTNAME está vacío'
[[ "$TURN0X_HOSTNAME" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]$ ]] || die 'TURN0X_HOSTNAME no tiene formato DNS válido'
[[ -n "${TURN0X_TIMEZONE:-}" ]] || die 'TURN0X_TIMEZONE está vacío'
[[ -n "${TURN0X_NTP_SERVERS:-}" ]] || die 'TURN0X_NTP_SERVERS está vacío'
[[ -n "${TURN0X_CHROMIUM_BINARY:-}" ]] || die 'TURN0X_CHROMIUM_BINARY está vacío'
[[ -x "$TURN0X_CHROMIUM_BINARY" ]] || die "Chromium no es ejecutable: $TURN0X_CHROMIUM_BINARY"

profile_dir="${TURN0X_CHROMIUM_PROFILE_DIR:-/var/lib/turnox-kiosk/chromium-profile}"
[[ "$profile_dir" == /* ]] || die 'TURN0X_CHROMIUM_PROFILE_DIR debe ser una ruta absoluta'

configured_flags=()
if [[ -n "${TURN0X_CHROMIUM_EXTRA_FLAGS:-}" ]]; then
  read -r -a configured_flags <<< "$TURN0X_CHROMIUM_EXTRA_FLAGS"
fi
for flag in "${configured_flags[@]}"; do
  case "$flag" in
    --ignore-certificate-errors|--ignore-certificate-errors=*|--allow-insecure-localhost|--no-sandbox|--disable-web-security|--disable-features=IsolateOrigins|--disable-site-isolation-trials)
      die "flag inseguro rechazado: $flag"
      ;;
  esac
done

printf 'turnox-kiosk: configuración válida (%s)\n' "$CONFIG_FILE"
