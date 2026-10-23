'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function build(context) {
  if (process.platform !== 'darwin') return;
  const root = context?.packager?.projectDir || path.join(__dirname, '..');
  const arch = context ? require('builder-util').Arch[context.arch] : process.arch;
  const target = { arm64: 'arm64', x64: 'x86_64' }[arch];
  if (!target) throw new Error(`Unsupported macOS architecture: ${arch}`);
  const out = path.join(root, 'assets', 'macos');
  fs.mkdirSync(out, { recursive: true });
  execFileSync('xcrun', ['swiftc', '-O', '-target', `${target}-apple-macosx12.0`, path.join(root, 'build', 'notch-metrics.swift'), '-o', path.join(out, 'notch-metrics')], { stdio: 'inherit' });
}
module.exports = build;
if (require.main === module) build().catch((e) => { console.error(e); process.exit(1); });
