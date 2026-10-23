import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { buildEvents, dueEvents, Reminder } = require('../src/core/scheduler');
const { DEFAULTS, sanitize } = require('../src/core/settings');
const { timesForDay } = require('../src/core/prayer');

const settings = sanitize({});
const day = { year: 2026, month: 3, day: 10 };
const t = timesForDay(settings.location, day, settings);
const now = new Date(t.fajr.getTime() - 3 * 3600000);
const MIN = 60000;

describe('buildEvents', () => {
  const events = buildEvents(now, settings);
  const find = (id) => events.find((e) => e.id === id);

  it('is sorted by time', () => {
    for (let i = 1; i < events.length; i++) expect(events[i].at >= events[i - 1].at).toBe(true);
  });
  it('schedules pre-adhan, adhan for each prayer', () => {
    const pre = find('pre-adhan:asr:2026-03-10');
    const adhan = find('adhan:asr:2026-03-10');
    expect(adhan.at.getTime()).toBe(t.asr.getTime());
    expect(pre.at.getTime()).toBe(t.asr.getTime() - 10 * MIN);
  });
  it('morning adhkar follows Fajr, evening follows Asr, after-prayer follows each prayer', () => {
    expect(find('adhkar:morning:2026-03-10').at.getTime()).toBe(t.fajr.getTime() + 30 * MIN);
    expect(find('adhkar:evening:2026-03-10').at.getTime()).toBe(t.asr.getTime() + 15 * MIN);
    expect(find('adhkar:after-prayer-isha:2026-03-10').at.getTime()).toBe(t.isha.getTime() + 3 * MIN);
  });
  it('does not schedule Sunrise as a prayer', () => {
    expect(events.some((e) => e.prayer === 'sunrise')).toBe(false);
  });
  it('has unique ids', () => {
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });
  it('respects disabled options', () => {
    const off = sanitize({
      notifications: { preAdhanMinutes: 0, atAdhan: false },
      adhkar: { morning: { enabled: false }, evening: { enabled: false }, afterPrayer: { enabled: false } },
    });
    expect(buildEvents(now, off)).toEqual([]);
  });
  it('limits after-prayer adhkar to chosen prayers', () => {
    const s = sanitize({ adhkar: { afterPrayer: { enabled: true, prayers: ['fajr'] } }, notifications: { preAdhanMinutes: 0, atAdhan: false }, });
    const ids = buildEvents(now, { ...s, adhkar: { ...s.adhkar, morning: { enabled: false }, evening: { enabled: false } } }).map((e) => e.prayer);
    expect(new Set(ids)).toEqual(new Set(['fajr']));
  });
});

describe('dueEvents', () => {
  const e = (id, at) => ({ id, at: new Date(at) });
  const events = [e('a', 1000), e('b', 2000), e('c', 3000)];
  it('returns events in (from, to]', () => {
    expect(dueEvents(events, new Date(1000), new Date(3000)).map((x) => x.id)).toEqual(['b', 'c']);
  });
  it('skips stale events after a long sleep', () => {
    expect(dueEvents(events, new Date(0), new Date(10 * MIN))).toEqual([]);
  });
});

describe('Reminder runner', () => {
  function setup(startAt) {
    let current = new Date(startAt);
    const seen = [];
    const r = new Reminder({ getSettings: () => settings, onEvent: (e) => seen.push(e.id), now: () => current, timers: { setInterval: () => 1, clearInterval: () => {} } });
    return { r, seen, advance: (ms) => { current = new Date(current.getTime() + ms); r.tick(); } };
  }

  it('fires the adhan once as time passes it, never twice', () => {
    const { r, seen, advance } = setup(t.dhuhr.getTime() - 5000);
    r.tick();
    advance(2000); advance(2000); advance(2000); advance(2000);
    expect(seen.filter((id) => id === 'adhan:dhuhr:2026-03-10')).toHaveLength(1);
  });

  it('does not replay old events when the machine wakes from a long sleep', () => {
    const { r, seen, advance } = setup(t.fajr.getTime() - 1000);
    r.tick();
    seen.length = 0;
    advance(8 * 3600 * 1000);
    expect(seen).toEqual([]);
  });

  it('picks up changed settings on the next tick', () => {
    let current = new Date(t.asr.getTime() - 3000);
    let s = settings;
    const seen = [];
    const r = new Reminder({ getSettings: () => s, onEvent: (e) => seen.push(e.id), now: () => current, timers: { setInterval: () => 1, clearInterval: () => {} } });
    r.tick();
    s = sanitize({ notifications: { atAdhan: false } });
    current = new Date(t.asr.getTime() + 1000);
    r.tick();
    expect(seen).not.toContain('adhan:asr:2026-03-10');
  });

  it('start/stop manage the interval handle', () => {
    const setI = vi.fn(() => 42), clearI = vi.fn();
    const r = new Reminder({ getSettings: () => settings, onEvent() {}, timers: { setInterval: setI, clearInterval: clearI } });
    r.start(); r.start();
    expect(setI).toHaveBeenCalledTimes(1);
    r.stop();
    expect(clearI).toHaveBeenCalledWith(42);
  });
});
