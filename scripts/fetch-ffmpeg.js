const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const vendorDir = path.join(root, 'vendor', 'win32-x64');
const tempDir = path.join(root, '.ffmpeg-download');
const zipPath = path.join(tempDir, 'ffmpeg-lgpl.zip');
const extractDir = path.join(tempDir, 'expanded');
const downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n7.1-latest-win64-lgpl-shared-7.1.zip';

function assertInsideRoot(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Unsafe path: ${resolved}`);
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

async function main() {
  if (process.platform !== 'win32') throw new Error('FeiGe currently packages the Windows x64 FFmpeg build.');
  assertInsideRoot(tempDir);
  await fsp.rm(tempDir, { recursive: true, force: true });
  await fsp.mkdir(tempDir, { recursive: true });
  process.stdout.write('Downloading the LGPL FFmpeg runtime...\n');
  const response = await fetch(downloadUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  await fsp.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
  const escapedZip = zipPath.replaceAll("'", "''");
  const escapedExtract = extractDir.replaceAll("'", "''");
  await run('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedExtract}' -Force`]);

  const folders = await fsp.readdir(extractDir, { withFileTypes: true });
  const rootFolder = folders.find(entry => entry.isDirectory());
  if (!rootFolder) throw new Error('The downloaded archive has an unexpected layout.');
  const binDir = path.join(extractDir, rootFolder.name, 'bin');
  const required = ['ffmpeg.exe', 'ffprobe.exe', 'avcodec-61.dll', 'avdevice-61.dll', 'avfilter-10.dll', 'avformat-61.dll', 'avutil-59.dll', 'swresample-5.dll', 'swscale-8.dll'];
  await fsp.mkdir(vendorDir, { recursive: true });
  for (const name of required) await fsp.copyFile(path.join(binDir, name), path.join(vendorDir, name));
  await fsp.rm(tempDir, { recursive: true, force: true });
  process.stdout.write('FFmpeg is ready in vendor/win32-x64/.\n');
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
