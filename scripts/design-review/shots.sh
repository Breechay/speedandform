#!/bin/sh
# The review screenshots. Chrome instances must run one at a time — in parallel
# they race on the profile directory and silently capture each other's frames.
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$(dirname "$0")/../../form-labs-design-review/screenshots"
BASE="${BASE:-http://localhost:4321/form-labs-design-review/}"
mkdir -p "$OUT"
shot() {
  rm -rf "/tmp/lc-$1"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --user-data-dir="/tmp/lc-$1" --window-size=$2,$3 --virtual-time-budget=9000 \
    --screenshot="$OUT/$1.png" "$4" >/dev/null 2>&1 || true
  printf '%-34s %s\n' "$1" "$(sips -g pixelWidth -g pixelHeight "$OUT/$1.png" 2>/dev/null | awk '/pixel/{printf "%s ", $2}')"
}
shot 01-plan-desktop-1600         1600 1600 "$BASE#/a/jose/plan"
shot 02-week-desktop-1600         1600 1100 "$BASE#/a/jose/week/8"
shot 03-week-phone-portrait-390    390  844 "$BASE#/a/jose/week/8"
shot 04-week-phone-landscape-844   844  390 "$BASE#/a/jose/week/8"
shot 05-athlete-week-desktop-1600 1600 1100 "$BASE?as=athlete#/a/jose/week/8"
shot 06-athlete-week-phone-390     390  844 "$BASE?as=athlete#/a/jose/week/8"
shot 07-athlete-plan-desktop-1600 1600 1600 "$BASE?as=athlete#/a/jose/plan"
