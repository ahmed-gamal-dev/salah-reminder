// Captures the released Windows app through its existing SALAH_SHOT helper.
// Resizes real Electron windows before capture; does not recreate or alter the UI.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const [exe, output] = process.argv.slice(2);
if (!exe || !output) throw new Error('Usage: node capture-store-artwork.mjs <exe> <output>');
await fs.mkdir(output, { recursive: true });
const child = spawn(exe, ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9225'], {
  env: { ...process.env, SALAH_SHOT: output }, stdio: 'inherit',
});
let exited = false;
const finished = new Promise((resolve, reject) => {
  child.once('error', reject); child.once('exit', code => { exited = true; code === 0 ? resolve() : reject(new Error(`App exited ${code}`)); });
});
const seen = new Set();
async function resize(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0; const pending = new Map();
  socket.addEventListener('message', event => { const d = JSON.parse(event.data); if (!pending.has(d.id)) return; const [resolve, reject] = pending.get(d.id); pending.delete(d.id); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, [resolve, reject]); socket.send(JSON.stringify({ id, method, params })); });
  try {
    const { windowId } = await call('Browser.getWindowForTarget');
    await call('Browser.setWindowBounds', { windowId, bounds: { width: 1600, height: 1000 } });
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
for (const name of ['settings-ar.png', 'adhkar-ar.png']) {
  const image = await fs.readFile(path.join(output, name));
  const width = image.readUInt32BE(16), height = image.readUInt32BE(20);
  if (width < 1366 || height < 768) throw new Error(`Store screenshot too small: ${name} ${width}x${height}`);
  console.log(`${name}: ${width}x${height}`);
}
