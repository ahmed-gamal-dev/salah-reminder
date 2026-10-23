'use strict';
// Builds the browser extension for Chrome and Firefox from one codebase (shares src/core and data/ with the desktop app).
//   node scripts/build-extension.js [--zip]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');
const { buildManifest } = require('../extension/manifest');

const root = path.join(__dirname, '..');
const version = require('../package.json').version;
const out = path.join(root, 'dist-extension');
const entries = ['background', 'popup', 'options', 'adhkar'];

async function build(target) {
  const dir = path.join(out, target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await esbuild.build({
    entryPoints: Object.fromEntries(entries.map((e) => [e, path.join(root, 'extension', 'src', `${e}.js`)])),
    outdir: dir, bundle: true, format: 'iife', platform: 'browser', target: ['chrome116', 'firefox128'], minify: false, logLevel: 'warning',
  });
  for (const f of fs.readdirSync(path.join(root, 'extension')).filter((n) => n.endsWith('.html'))) fs.copyFileSync(path.join(root, 'extension', f), path.join(dir, f));
  fs.copyFileSync(path.join(root, 'src', 'renderer', 'style.css'), path.join(dir, 'style.css'));
  fs.cpSync(path.join(root, 'extension', 'icons'), path.join(dir, 'icons'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(buildManifest(target, version), null, 2));
  if (process.argv.includes('--zip')) {
    const zip = path.join(out, `salah-reminder-${target}-${version}.zip`);
    fs.rmSync(zip, { force: true });
    execFileSync('zip', ['-qr', zip, '.'], { cwd: dir });
    console.log('zipped', path.relative(root, zip));
  }
  console.log('built', path.relative(root, dir));
}

(async () => { for (const t of ['chrome', 'firefox']) await build(t); })().catch((e) => { console.error(e); process.exit(1); });
