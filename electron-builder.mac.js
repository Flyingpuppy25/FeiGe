const path = require('path');

const arch = process.arch;
if (!['x64', 'arm64'].includes(arch)) throw new Error(`Unsupported macOS architecture: ${arch}`);

module.exports = {
  appId: 'com.feige.storyboard',
  productName: 'FeiGe',
  asar: true,
  directories: {
    output: 'release-mac'
  },
  files: [
    'src/**/*',
    'assets/**/*',
    'package.json'
  ],
  extraResources: [
    {
      from: path.join('vendor', `darwin-${arch}`),
      to: 'vendor',
      filter: ['**/*']
    }
  ],
  mac: {
    target: ['dir'],
    category: 'public.app-category.video',
    minimumSystemVersion: '12.0',
    identity: '-',
    hardenedRuntime: false,
    gatekeeperAssess: false,
    artifactName: 'FeiGe-${version}-macOS-${arch}.${ext}'
  }
};
