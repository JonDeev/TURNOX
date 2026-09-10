#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_FILE="${TURN0X_KIOSK_CONFIG:-/etc/turnox/kiosk.conf}"

"$SCRIPT_DIR/validate-config.sh"

set -a
# shellcheck disable=SC1090
. "$CONFIG_FILE"
set +a

profile_dir="${TURN0X_CHROMIUM_PROFILE_DIR:-/var/lib/turnox-kiosk/chromium-profile}"
mkdir -p "$profile_dir"

extra_flags=()
if [[ -n "${TURN0X_CHROMIUM_EXTRA_FLAGS:-}" ]]; then
  read -r -a extra_flags <<< "$TURN0X_CHROMIUM_EXTRA_FLAGS"
fi

exec "$TURN0X_CHROMIUM_BINARY" \
  --kiosk \
  --no-first-run \
  --no-default-browser-check \
  --disable-session-crashed-bubble \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --user-data-dir="$profile_dir" \
  "${extra_flags[@]}" \
  "$TURN0X_KIOSK_URL"
