import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import vm from 'vm';
import path from 'path';
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const { buildManifest } = require('../extension/manifest');
const { planAlarms, badgeText, notificationFor } = require('../extension/src/schedule');
const { buildEvents } = require('../src/core/scheduler');
const { sanitize } = require('../src/core/settings');
const { timesForDay } = require('../src/core/prayer');

const settings = sanitize({ language: 'en', prayerAction: { mode: 'lock' } });
const t = timesForDay(settings.location, { year: 2026, month: 3, day: 10 }, settings);
const now = new Date(t.fajr.getTime() - 3600000);

describe('manifest', () => {
  it('chrome uses a service worker, firefox an event page + gecko id', () => {
    const c = buildManifest('chrome', '1.2.3');
    const f = buildManifest('firefox', '1.2.3');
    expect(c.background).toEqual({ service_worker: 'background.js' });
    expect(f.background).toEqual({ scripts: ['background.js'] });
    expect(f.browser_specific_settings.gecko.id).toMatch(/@/);
    expect(c.browser_specific_settings).toBeUndefined();
    for (const m of [c, f]) {
      expect(m.manifest_version).toBe(3);
      expect(m.version).toBe('1.2.3');
      expect(m.permissions.sort()).toEqual(['alarms', 'notifications', 'storage']);
    }
  });
  it('rejects unknown targets', () => expect(() => buildManifest('safari', '1')).toThrow());
});

describe('planAlarms', () => {
  const plan = planAlarms(now, settings);
  it('only plans future, notifiable events within the horizon (never desktop-only lock actions)', () => {
    expect(plan.length).toBeGreaterThan(0);
    for (const a of plan) {
      expect(a.when).toBeGreaterThan(now.getTime());
      expect(a.when).toBeLessThanOrEqual(now.getTime() + 36 * 3600000);
      expect(a.name.startsWith('ev:')).toBe(true);
      expect(a.id.startsWith('prayer-action')).toBe(false);
    }
  });
  it('includes the Fajr adhan at the exact time', () => {
    expect(plan.find((a) => a.id === 'adhan:fajr:2026-03-10').when).toBe(t.fajr.getTime());
  });
});

describe('badge and notification text', () => {
  it('formats badge', () => {
    expect(badgeText(5 * 60000)).toBe('5m');
    expect(badgeText(59 * 60000 + 1)).toBe('1h'); // rounds up to 60 min
    expect(badgeText(150 * 60000)).toBe('2h');
    expect(badgeText(-1)).toBe('0m');
  });
  it('builds localized notifications', () => {
    const events = buildEvents(now, settings);
    const adhan = events.find((e) => e.id === 'adhan:asr:2026-03-10');
    expect(notificationFor(adhan, settings).title).toContain('Asr');
    const pre = events.find((e) => e.id === 'pre-adhan:asr:2026-03-10');
    expect(notificationFor(pre, settings).title).toBe('Asr in 10 minutes');
    const dhikr = events.find((e) => e.id === 'adhkar:morning:2026-03-10');
    expect(notificationFor(dhikr, settings)).toMatchObject({ category: 'morning', title: 'Morning adhkar' });
    expect(notificationFor(events.find((e) => e.type === 'prayer-action'), settings)).toBeNull();
  });
});

describe('background script (bundled, run against a fake browser API)', () => {
  async function load(storedSettings, nowMs) {
    const built = await esbuild.build({ entryPoints: [path.join(__dirname, '../extension/src/background.js')], bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent' });
    const log = { alarms: new Map(), notifications: [], badge: [] };
    const listeners = {};
    const ev = (name) => ({ addListener: (fn) => { listeners[name] = fn; } });
    const chrome = {
      storage: { local: { get: async () => ({ settings: storedSettings }) }, onChanged: ev('storageChanged') },
      alarms: { clearAll: async () => log.alarms.clear(), create: (n, o) => log.alarms.set(n, o), onAlarm: ev('alarm') },
      action: { setBadgeText: async (o) => log.badge.push(o.text), setBadgeBackgroundColor: async () => {}, setTitle: async () => {} },
      notifications: { create: async (id, o) => log.notifications.push({ id, ...o }), onClicked: ev('clicked'), clear: () => {} },
      runtime: { onInstalled: ev('installed'), onStartup: ev('startup'), getURL: (p) => `ext://${p}` },
      tabs: { create: () => {} },
    };
    const RealDate = Date;
    class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [nowMs])); } static now() { return nowMs; } }
    vm.runInNewContext(built.outputFiles[0].text, { chrome, Date: FakeDate, console, URLSearchParams, Intl, setTimeout, clearTimeout });
    return { log, listeners };
  }
  const tick = () => new Promise((r) => setTimeout(r, 50));

  it('schedules alarms and badge on install, and notifies when an adhan alarm fires', async () => {
    const stored = sanitize({ language: 'en' });
    const at = timesForDay(stored.location, { year: 2026, month: 3, day: 10 }, stored).asr.getTime();
    const { log, listeners } = await load(stored, at - 3600000);
    await listeners.installed();
    expect(log.alarms.has('ev:adhan:asr:2026-03-10')).toBe(true);
    expect(log.alarms.get('ev:adhan:asr:2026-03-10').when).toBe(at);
    expect(log.alarms.has('badge')).toBe(true);
    expect(log.badge.at(-1)).toMatch(/^\d+[mh]$/);

    // fire it "at" the prayer time
    const loaded = await load(stored, at + 1000);
    loaded.listeners.alarm({ name: 'ev:adhan:asr:2026-03-10' });
    await tick();
    expect(loaded.log.notifications).toHaveLength(1);
    expect(loaded.log.notifications[0].title).toContain('Asr');
  });

  it('drops stale alarms (browser slept through them)', async () => {
    const stored = sanitize({ language: 'en' });
    const at = timesForDay(stored.location, { year: 2026, month: 3, day: 10 }, stored).asr.getTime();
    const { log, listeners } = await load(stored, at + 3600000);
    listeners.alarm({ name: 'ev:adhan:asr:2026-03-10' });
    await tick();
    expect(log.notifications).toHaveLength(0);
  });
});
