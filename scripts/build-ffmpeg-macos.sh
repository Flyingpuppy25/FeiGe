#!/usr/bin/env bash
set -euo pipefail

FFMPEG_VERSION="7.1.5"
FFMPEG_SHA256="de668509caf9e35e3cd162473441fdb29538c6d96ed080292b3cf9e6fc5d558f"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_ARCH="$(node -p 'process.arch')"

case "$NODE_ARCH" in
  x64) FFMPEG_ARCH="x86_64" ;;
  arm64) FFMPEG_ARCH="aarch64" ;;
  *) echo "Unsupported macOS architecture: $NODE_ARCH" >&2; exit 1 ;;
esac

BUILD_ROOT="${RUNNER_TEMP:-$ROOT/.ffmpeg-build}/feige-ffmpeg-$NODE_ARCH"
ARCHIVE="$BUILD_ROOT/ffmpeg-$FFMPEG_VERSION.tar.xz"
SOURCE="$BUILD_ROOT/ffmpeg-$FFMPEG_VERSION"
PREFIX="$BUILD_ROOT/prefix"
VENDOR="$ROOT/vendor/darwin-$NODE_ARCH"

rm -rf "$BUILD_ROOT" "$VENDOR"
mkdir -p "$BUILD_ROOT" "$VENDOR"

curl --fail --location --retry 4 \
  "https://ffmpeg.org/releases/ffmpeg-$FFMPEG_VERSION.tar.xz" \
  --output "$ARCHIVE"
printf '%s  %s\n' "$FFMPEG_SHA256" "$ARCHIVE" | shasum -a 256 --check
tar -xf "$ARCHIVE" -C "$BUILD_ROOT"

export MACOSX_DEPLOYMENT_TARGET="12.0"
cd "$SOURCE"
./configure \
  --prefix="$PREFIX" \
  --arch="$FFMPEG_ARCH" \
  --cc=clang \
  --enable-shared \
  --disable-static \
  --disable-doc \
  --disable-debug \
  --disable-ffplay \
  --disable-gpl \
  --disable-nonfree \
  --disable-autodetect \
  --enable-videotoolbox \
  --enable-audiotoolbox \
  --install-name-dir='@executable_path'

make -j"$(sysctl -n hw.ncpu)"
make install

cp "$PREFIX/bin/ffmpeg" "$PREFIX/bin/ffprobe" "$VENDOR/"
cp -a "$PREFIX/lib/"*.dylib "$VENDOR/"
cp "$SOURCE/COPYING.LGPLv2.1" "$VENDOR/FFMPEG-LGPL-2.1.txt"
cp "$SOURCE/LICENSE.md" "$VENDOR/FFMPEG-LICENSE.md"

chmod +x "$VENDOR/ffmpeg" "$VENDOR/ffprobe"
codesign --force --sign - "$VENDOR/ffmpeg" "$VENDOR/ffprobe"

"$VENDOR/ffmpeg" -hide_banner -version
"$VENDOR/ffprobe" -hide_banner -version
"$VENDOR/ffmpeg" -hide_banner -filters | grep -q 'xstack'

if otool -L "$VENDOR/ffmpeg" "$VENDOR/ffprobe" "$VENDOR/"*.dylib | grep -E '/(usr/local|opt/homebrew|private/tmp|Users)/'; then
  echo 'FFmpeg contains a non-portable library reference.' >&2
  exit 1
fi

echo "Portable LGPL FFmpeg runtime ready: $VENDOR"
