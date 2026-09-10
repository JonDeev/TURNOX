#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" -eq 0 ]] || { printf 'Ejecutar como root.\n' >&2; exit 1; }
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
CONFIG_DIR=/etc/turnox
LIBEXEC_DIR=/usr/local/libexec/turnox-kiosk
SYSTEMD_DIR=/etc/systemd/system
USER_NAME=turnox-kiosk

command -v install >/dev/null || { printf 'install no está disponible.\n' >&2; exit 1; }
command -v systemctl >/dev/null || { printf 'systemctl no está disponible.\n' >&2; exit 1; }

if ! getent group "$USER_NAME" >/dev/null; then
  groupadd "$USER_NAME"
fi
if ! id "$USER_NAME" >/dev/null 2>&1; then
  useradd --gid "$USER_NAME" --home-dir "/home/$USER_NAME" \
    --create-home --shell /bin/bash "$USER_NAME"
else
  existing_shell="$(getent passwd "$USER_NAME" | cut -d: -f7)"
  if [[ "$existing_shell" != /bin/bash ]]; then
    printf 'El usuario %s existe con shell %s; para Ubuntu Desktop debe cambiarse explícitamente a /bin/bash.\n' \
      "$USER_NAME" "$existing_shell" >&2
    exit 1
  fi
fi

install -d -o root -g "$USER_NAME" -m 0750 "$CONFIG_DIR"
install -d -o "$USER_NAME" -g "$USER_NAME" -m 0750 /var/lib/turnox-kiosk
install -d -o "$USER_NAME" -g "$USER_NAME" -m 0750 /var/cache/turnox-kiosk

if [[ ! -e "$CONFIG_DIR/kiosk.conf" ]]; then
  install -o root -g "$USER_NAME" -m 0640 "$ROOT_DIR/config/kiosk.conf.example" "$CONFIG_DIR/kiosk.conf"
  printf 'Creada configuración inicial: %s\n' "$CONFIG_DIR/kiosk.conf"
else
  printf 'Se conserva configuración existente: %s\n' "$CONFIG_DIR/kiosk.conf"
fi

install -d -o root -g root -m 0755 "$LIBEXEC_DIR"
for script in validate-config.sh launch-chromium.sh launch-cage.sh; do
  install -o root -g root -m 0755 "$ROOT_DIR/scripts/$script" "$LIBEXEC_DIR/$script"
done
install -o root -g root -m 0644 "$ROOT_DIR/systemd/turnox-kiosk-cage.service" "$SYSTEMD_DIR/turnox-kiosk-cage.service"
install -o root -g root -m 0644 "$ROOT_DIR/systemd/turnox-kiosk-desktop.service" "$SYSTEMD_DIR/turnox-kiosk-desktop.service"
systemctl daemon-reload

printf '%s\n' 'Baseline instalado. Ninguna opción fue habilitada.'
printf '%s\n' "Editar $CONFIG_DIR/kiosk.conf y ejecutar validate-config.sh antes de activar un único perfil."
