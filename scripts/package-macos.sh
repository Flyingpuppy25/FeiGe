#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
ARCH="$(node -p 'process.arch')"
OUTPUT="$ROOT/release-mac"
APP="$(find "$OUTPUT" -maxdepth 3 -type d -name 'FeiGe.app' -print -quit)"

if [[ -z "$APP" || ! -d "$APP" ]]; then
  echo 'FeiGe.app was not found in release-mac.' >&2
  exit 1
fi

STAGE="$OUTPUT/FeiGe-$VERSION-macOS-$ARCH"
ZIP="$OUTPUT/FeiGe-$VERSION-macOS-$ARCH.zip"
SHA="$OUTPUT/FeiGe-$VERSION-macOS-$ARCH-SHA256.txt"

rm -rf "$STAGE" "$ZIP" "$SHA"
mkdir -p "$STAGE/docs"
ditto "$APP" "$STAGE/FeiGe.app"
cp "$ROOT/README.md" "$ROOT/LICENSE" "$ROOT/THIRD_PARTY_NOTICES.md" "$STAGE/"
cp "$ROOT/docs/macOS使用说明.txt" "$ROOT/docs/更新说明.txt" "$STAGE/docs/"

codesign --verify --deep --strict "$STAGE/FeiGe.app"
test -x "$STAGE/FeiGe.app/Contents/Resources/vendor/ffmpeg"
test -x "$STAGE/FeiGe.app/Contents/Resources/vendor/ffprobe"

ditto -c -k --sequesterRsrc --keepParent "$STAGE" "$ZIP"
cd "$OUTPUT"
shasum -a 256 "$(basename "$ZIP")" > "$(basename "$SHA")"
echo "Created $ZIP"
