#!/bin/zsh

set -euo pipefail

GRAPHQL_ENDPOINT="${ENROLLMENT_SERVICE_URL:-https://enrollment-service-v2-production.shagai.workers.dev}"
TMPFILE="/tmp/wallpaper_image"
FINAL_PNG="/tmp/wallpaper_image_$(date +%s).png"
QUERY='query GetMacWallpaperUrl { getMacWallpaperUrl }'

echo "Fetching wallpaper URL from GraphQL..."
RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$QUERY\"}")

WALLPAPER_URL=$(echo "$RESPONSE" | /usr/bin/python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("getMacWallpaperUrl",""))')

if [[ -z "$WALLPAPER_URL" || "$WALLPAPER_URL" == "null" ]]; then
  echo "Error: No wallpaper URL found. Response: $RESPONSE"
  exit 1
fi

echo "Wallpaper URL: $WALLPAPER_URL"
echo "Downloading wallpaper..."
curl -L -s -S -A "Mozilla/5.0" "$WALLPAPER_URL" -o "$TMPFILE"

CONTENT_TYPE=$(file --mime-type -b "$TMPFILE" || true)
if [[ "$CONTENT_TYPE" == "image/webp" ]]; then
  if ! command -v dwebp >/dev/null 2>&1; then
    echo "Error: dwebp is required for webp conversion. Run: brew install webp"
    exit 1
  fi
  dwebp "$TMPFILE" -o "$FINAL_PNG"
else
  cp "$TMPFILE" "$FINAL_PNG"
fi

CONSOLE_USER=$(stat -f %Su /dev/console)
if [[ -z "$CONSOLE_USER" || "$CONSOLE_USER" == "root" ]]; then
  echo "Error: No active desktop user session found."
  exit 1
fi

USER_ID=$(id -u "$CONSOLE_USER")
SCRIPT='tell application "System Events"
  tell every desktop
    set picture to POSIX file "'"$FINAL_PNG"'"
  end tell
end tell'

launchctl asuser "$USER_ID" sudo -u "$CONSOLE_USER" osascript -e "$SCRIPT"

echo "Wallpaper updated successfully for user: $CONSOLE_USER"
