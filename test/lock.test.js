import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { lockCommands, lockScreen } = require('../src/core/lock');
const { buildEvents } = require('../src/core/scheduler');
const { sanitize } = require('../src/core/settings');
const { timesForDay } = require('../src/core/prayer');

describe('lockCommands', () => {
  it('has a command for each platform', () => {
    expect(lockCommands('win32')[0]).toEqual({ cmd: 'rundll32.exe', args: ['user32.dll,LockWorkStation'] });
    expect(lockCommands('linux')[0].cmd).toBe('loginctl');
    expect(lockCommands('darwin').some((c) => c.cmd === 'pmset')).toBe(true);
  });
});

describe('lockScreen', () => {
  it('stops at the first command that works', async () => {
    const calls = [];
    const r = await lockScreen({ platform: 'linux', run: async (cmd) => { calls.push(cmd); if (cmd === 'loginctl') throw new Error('nope'); } });
    expect(r).toEqual({ ok: true, used: 'xdg-screensaver' });
    expect(calls).toEqual(['loginctl', 'xdg-screensaver']);
  });
  it('reports every failure when nothing works', async () => {
    const r = await lockScreen({ platform: 'linux', run: async () => { throw new Error('x'); } });
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(4);
  });
  it('skips helpers that do not exist (macOS CGSession on new releases)', async () => {
    const calls = [];
    const r = await lockScreen({ platform: 'darwin', exists: () => false, run: async (cmd) => { calls.push(cmd); } });
    expect(calls).toEqual(['pmset']);
    expect(r.used).toBe('pmset');
  });
});

describe('prayer-action events', () => {
  const base = sanitize({});
  const now = new Date('2026-03-10T00:00:00Z');
  const t = timesForDay(base.location, { year: 2026, month: 3, day: 10 }, base);

  it('are absent by default', () => {
    expect(buildEvents(now, base).some((e) => e.type === 'prayer-action')).toBe(false);
  });
  it('fire at prayer time + delay, only for chosen prayers', () => {
    const s = sanitize({ prayerAction: { mode: 'ask', prayers: ['maghrib'], delayMinutes: 2 } });
    const ev = buildEvents(now, s).filter((e) => e.type === 'prayer-action' && e.dayKey === '2026-03-10');
    expect(ev).toHaveLength(1);
    expect(ev[0].prayer).toBe('maghrib');
    expect(ev[0].mode).toBe('ask');
    expect(ev[0].at.getTime()).toBe(t.maghrib.getTime() + 2 * 60000);
  });
});
