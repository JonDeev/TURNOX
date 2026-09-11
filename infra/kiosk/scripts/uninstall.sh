#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" -eq 0 ]] || { printf 'Ejecutar como root.\n' >&2; exit 1; }
REMOVE_CONFIG=false
if [[ "${1:-}" == --remove-config ]]; then
  REMOVE_CONFIG=true
elif [[ "$#" -gt 0 ]]; then
  printf 'Uso: %s [--remove-config]\n' "$0" >&2
  exit 2
fi

systemctl disable --now turnox-kiosk-cage.service 2>/dev/null || true
systemctl daemon-reload
rm -f /etc/systemd/system/turnox-kiosk-cage.service /etc/systemd/user/turnox-kiosk-desktop.service
rm -f /usr/local/libexec/turnox-kiosk/validate-config.sh
rm -f /usr/local/libexec/turnox-kiosk/launch-chromium.sh
rm -f /usr/local/libexec/turnox-kiosk/launch-cage.sh
rmdir /usr/local/libexec/turnox-kiosk 2>/dev/null || true
if "$REMOVE_CONFIG"; then
  rm -f /etc/turnox/kiosk.conf
fi
rmdir /etc/turnox 2>/dev/null || true
systemctl daemon-reload
printf '%s\n' 'Archivos del baseline retirados; el usuario, paquetes y datos del kiosco se conservaron.'
