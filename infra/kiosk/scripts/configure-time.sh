#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" -eq 0 ]] || { printf 'Ejecutar como root.\n' >&2; exit 1; }
CONFIG_FILE="${TURN0X_KIOSK_CONFIG:-/etc/turnox/kiosk.conf}"
set -a
# shellcheck disable=SC1090
. "$CONFIG_FILE"
set +a

[[ -n "${TURN0X_TIMEZONE:-}" ]] || { printf 'TURN0X_TIMEZONE está vacío.\n' >&2; exit 1; }
[[ -n "${TURN0X_NTP_SERVERS:-}" ]] || { printf 'TURN0X_NTP_SERVERS está vacío.\n' >&2; exit 1; }
command -v timedatectl >/dev/null || { printf 'timedatectl no está disponible.\n' >&2; exit 1; }
[[ -d /etc/systemd ]] || { printf 'systemd no está disponible.\n' >&2; exit 1; }

timedatectl set-timezone "$TURN0X_TIMEZONE"
install -d -m 0755 /etc/systemd/timesyncd.conf.d
tmp_file="$(mktemp /etc/systemd/timesyncd.conf.d/turnox-kiosk.XXXXXX)"
trap 'rm -f "$tmp_file"' EXIT
printf '[Time]\nNTP=%s\nFallbackNTP=\n' "$TURN0X_NTP_SERVERS" > "$tmp_file"
chown root:root "$tmp_file"
chmod 0644 "$tmp_file"
mv -f "$tmp_file" /etc/systemd/timesyncd.conf.d/turnox-kiosk.conf
systemctl enable --now systemd-timesyncd.service
timedatectl set-ntp true
printf 'Zona horaria y NTP LAN configurados; verificar con timedatectl timesync-status.\n'
