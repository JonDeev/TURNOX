#!/usr/bin/env bash
set -Eeuo pipefail

CONFIG_FILE="${TURN0X_KIOSK_CONFIG:-/etc/turnox/kiosk.conf}"

"$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/validate-config.sh"

set -a
# shellcheck disable=SC1090
. "$CONFIG_FILE"
set +a

[[ -n "${TURN0X_CAGE_BINARY:-}" ]] || {
  printf 'turnox-kiosk: ERROR: TURN0X_CAGE_BINARY está vacío\n' >&2
  exit 1
}
[[ -x "$TURN0X_CAGE_BINARY" ]] || {
  printf 'turnox-kiosk: ERROR: cage no es ejecutable: %s\n' "$TURN0X_CAGE_BINARY" >&2
  exit 1
}

exec "$TURN0X_CAGE_BINARY" -- /usr/local/libexec/turnox-kiosk/launch-chromium.sh
