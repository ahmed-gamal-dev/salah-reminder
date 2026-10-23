// Captures the released Windows app through its existing SALAH_SHOT helper.
// Captures a larger real Chromium viewport; does not recreate UI or replace application data.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const [inputExe, inputOutput] = process.argv.slice(2);
if (!inputExe || !inputOutput) throw new Error('Usage: node capture-store-artwork.mjs <exe> <output>');
const exe = path.resolve(inputExe), output = path.resolve(inputOutput);
await fs.access(exe);
await fs.mkdir(output, { recursive: true });
const child = spawn(exe, ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9225'], {
  env: { ...process.env, SALAH_SHOT: output }, stdio: 'inherit',
});
let exited = false;
const finished = new Promise((resolve, reject) => {
  child.once('error', reject); child.once('exit', code => { exited = true; code === 0 ? resolve() : reject(new Error(`App exited ${code}`)); });
});
const seen = new Set(); const captures = new Map();
async function resize(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0; const pending = new Map();
  socket.addEventListener('message', event => { const d = JSON.parse(event.data); if (!pending.has(d.id)) return; const [resolve, reject] = pending.get(d.id); pending.delete(d.id); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, [resolve, reject]); socket.send(JSON.stringify({ id, method, params })); });
  try {
    await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1366, screenHeight: 900 });
    await call('Emulation.setVisibleSize', { width: 1366, height: 900 });
    for (let i = 0; i < 12; i++) {
      const result = await call('Runtime.evaluate', { expression: 'Boolean(document.querySelector(\"h1\"))', returnByValue: true });
      if (result.result.value) break;
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    captures.set(target.url.includes('/settings.html') ? 'settings-ar.png' : 'adhkar-ar.png', Buffer.from(shot.data, 'base64'));
  } finally { socket.close(); }
}
const deadline = Date.now() + 45000;
while (!exited && Date.now() < deadline) {
  const targets = await fetch('http://127.0.0.1:9225/json/list').then(r => r.json()).catch(() => []);
  for (const t of targets.filter(t => /\/(settings|adhkar)\.html/.test(t.url) && !seen.has(t.id))) {
    await resize(t); seen.add(t.id);
  }
  await new Promise(resolve => setTimeout(resolve, 50));
}
if (!exited) { child.kill(); throw new Error('Screenshot helper timed out'); }
await finished;
for (const [name, image] of captures) await fs.writeFile(path.join(output, name), image);
for (const name of ['settings-ar.png', 'adhkar-ar.png']) {
  const image = await fs.readFile(path.join(output, name));
  const width = image.readUInt32BE(16), height = image.readUInt32BE(20);
  if (width < 1366 || height < 768) throw new Error(`Store screenshot too small: ${name} ${width}x${height}`);
  console.log(`${name}: ${width}x${height}`);
}
