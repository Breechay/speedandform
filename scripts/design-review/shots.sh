#!/bin/sh
# The review screenshots.
#
# Two things this has to work around. Chrome instances must run one at a time —
# in parallel they race on the profile directory and silently capture each
# other's frames. And headless writes the PNG but does not reliably exit on this
# machine, so each instance is launched detached and killed once its file has
# stopped growing. macOS has no `timeout`, hence the poll.
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="${OUT:-$(cd "$(dirname "$0")/../.." && pwd)/form-labs-design-review/screenshots}"
BASE="${BASE:-http://localhost:4321/form-labs-design-review/}"
FRAME="${FRAME:-${BASE}frame.html}"
# CSS variant to capture, e.g. VARIANT=v1 → ?css=v1. Empty = the shipped sheet.
VARIANT="${VARIANT:-}"
u() { # u <extra-query-or-empty> <hash>
  q=""
  [ -n "$VARIANT" ] && q="css=$VARIANT"
  [ -n "$1" ] && { [ -n "$q" ] && q="$q&$1" || q="$1"; }
  [ -n "$q" ] && printf '%s?%s%s' "$BASE" "$q" "$2" || printf '%s%s' "$BASE" "$2"
}
mkdir -p "$OUT"

shot() {
  name=$1; w=$2; h=$3; url=$4
  # Below 500px Chrome headless lays out at 500 and crops the image, so a
  # narrow window silently produces a cropped tablet rather than a phone.
  # Anything under 500 is rendered inside an exactly-sized iframe and the frame
  # is cropped back out. Verified: window=390 reports innerWidth=500.
  win_w=$w; capture="$OUT/$name.png"; target="$url"
  if [ "$w" -lt 500 ]; then
    win_w=520
    enc=$(printf '%s' "$url" | sed 's/%/%25/g; s/#/%23/g; s/&/%26/g; s/?/%3F/g')
    target="$FRAME#$w/$h/$enc"
  fi
  rm -rf "/tmp/lc-$name" "$capture"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 \
    --user-data-dir="/tmp/lc-$name" --window-size=$win_w,$h --virtual-time-budget=9000 \
    --screenshot="$capture" "$target" >/dev/null 2>&1 &
  pid=$!
  last=0; stable=0; i=0
  while [ $i -lt 40 ]; do
    sleep 1; i=$((i+1))
    size=$(stat -f%z "$capture" 2>/dev/null || echo 0)
    if [ "$size" -gt 0 ] && [ "$size" = "$last" ]; then
      stable=$((stable+1)); [ $stable -ge 2 ] && break
    else stable=0; fi
    last=$size
  done
  kill $pid 2>/dev/null || true; wait $pid 2>/dev/null || true
  rm -rf "/tmp/lc-$name"
  [ "$w" -lt 500 ] && sips -c "$h" "$w" "$capture" >/dev/null 2>&1
  printf '%-34s %s\n' "$name" "$(sips -g pixelWidth -g pixelHeight "$capture" 2>/dev/null | awk '/pixel/{printf "%s ", $2}')"
}

shot 01-plan-desktop-1600         1600 1600 "$(u '' '#/a/jose/plan')"
shot 02-week-desktop-1600         1600 1100 "$(u '' '#/a/jose/week/8')"
shot 03-week-phone-portrait-390    390  844 "$(u '' '#/a/jose/week/8')"
shot 04-week-phone-landscape-844   844  390 "$(u '' '#/a/jose/week/8')"
shot 05-athlete-week-desktop-1600 1600 1100 "$(u 'as=athlete' '#/a/jose/week/8')"
shot 06-athlete-week-phone-390     390  844 "$(u 'as=athlete' '#/a/jose/week/8')"
shot 07-athlete-plan-desktop-1600 1600 1600 "$(u 'as=athlete' '#/a/jose/plan')"
shot 08-week-laptop-1280          1280  800 "$(u '' '#/a/jose/week/8')"
shot 09-week-tablet-1024          1024  768 "$(u '' '#/a/jose/week/8')"
