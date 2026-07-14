# Third-Party Notices

FeiGe is licensed under Apache-2.0. Components listed below retain their own
licenses; the FeiGe license does not replace those terms.

## FFmpeg

FeiGe packages FFmpeg as separate executable and shared-library files under
`vendor/`.

The Windows x64 build is:

- FFmpeg `n7.1.5-2-g998de74adf-20260713`
- Windows x64 LGPL shared variant from
  [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds)
- FFmpeg source revision
  [`998de74adf`](https://github.com/FFmpeg/FFmpeg/commit/998de74adf)

The complete license text is included as `vendor/FFMPEG-LGPL-3.0.txt`. Build
and source information is included as `vendor/README.txt`. This build does not
enable FFmpeg's GPL or nonfree configuration options.

The macOS x64 and arm64 builds use FFmpeg `7.1.5`, compiled on the corresponding
GitHub-hosted macOS runner from the official
[FFmpeg release source](https://ffmpeg.org/releases/ffmpeg-7.1.5.tar.xz). They
are LGPL shared-library builds with GPL and nonfree components disabled. The
build script pins and verifies the source archive SHA-256 before compilation.
FFmpeg license files are included inside each application bundle.

## JavaScript dependencies

FeiGe uses Electron, electron-builder, archiver, docx, exceljs, undici, and
their transitive dependencies. Their license notices are retained in the
installed dependency packages and in the packaged application as applicable.
