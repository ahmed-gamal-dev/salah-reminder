import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import vm from 'vm';
const require = createRequire(import.meta.url);
const { sanitize } = require('../src/core/settings');
const { buildSummary } = require('../src/core/summary');

// Run the actual settings renderer against an IPC boundary that clones replies, like Electron.
// A small DOM fixture is enough: this test concerns successive saves, not browser layout.
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll(selector) { return walk(this).filter((n) => n.className?.split(' ').includes(selector.slice(1))); }
}
function walk(node) { return [node, ...node.children.flatMap((n) => n instanceof Element ? walk(n) : [])]; }
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

async function fixture() {
  const app = new Element('div');
  const timers = new Map(); let tid = 0;
  let stored = sanitize({ language: 'en' });
  const getState = () => structuredClone({ settings: stored, summary: buildSummary(new Date('2026-10-23T10:00:00Z'), stored), cities: [], methods: ['egyptian'], platform: 'darwin' });
  vm.runInNewContext(fs.readFileSync(new URL('../src/renderer/settings.js', import.meta.url), 'utf8'), {
    document: { getElementById: () => app, createElement: (tag) => new Element(tag), documentElement: {} },
    window: { salah: { getState: async () => getState(), save: async (incoming) => { stored = sanitize(structuredClone(incoming)); return structuredClone(stored); }, onStateChanged() {}, testSound() {} } },
    setTimeout: (cb) => { timers.set(++tid, cb); return tid; }, clearTimeout: (id) => timers.delete(id), setInterval() {},
  });
  await settle();
  const control = (label) => {
    const row = walk(app).find((n) => n.className === 'row' && n.children.some((c) => c instanceof Element && (c.textContent === label || c.children.includes(label))));
    return row.children.find((c) => c instanceof Element && ['input', 'select'].includes(c.tagName));
  };
  return {
    app, control, read: () => structuredClone(stored),
    async change(label, property, value) {
      const input = control(label); input[property] = value; input.onchange({ target: input });
      for (const [id, cb] of [...timers]) { timers.delete(id); await cb(); }
      await settle();
    },
  };
}

describe('settings renderer persistence', () => {
  it('keeps edits made after earlier saves and after testing audio', async () => {
    const f = await fixture();
    await f.change('12-hour clock', 'checked', false);
    expect(f.read().hour12).toBe(false);
    await f.change('Show countdown next to the tray icon', 'checked', false);
    expect(f.read().tray.showCountdown).toBe(false);
    await walk(f.app).find((n) => n.textContent === 'Test sound').onclick();
    await f.change('Volume', 'value', '0.35');
    expect(f.read().notifications.volume).toBe(0.35);
    expect(f.read().hour12).toBe(false);
    expect(f.read().tray.showCountdown).toBe(false);
  });
});
