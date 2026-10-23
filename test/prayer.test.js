import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { timesForDay, nextPrayer, currentPrayer, calendarDay, addDays, METHODS } = require('../src/core/prayer');
const { formatTime, formatCountdown, isFriday } = require('../src/core/i18n');

const cairo = { lat: 30.0444, lng: 31.2357 };
const TZ = 'Africa/Cairo';
const opts = { method: 'egyptian', madhab: 'shafi' };

describe('timesForDay', () => {
  it('returns the six times in chronological order', () => {
    const t = timesForDay(cairo, { year: 2026, month: 3, day: 10 }, opts);
    const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha];
    for (let i = 1; i < order.length; i++) expect(order[i] > order[i - 1]).toBe(true);
  });

  it('gives plausible Cairo times (local, Cairo zone) in March', () => {
    const t = timesForDay(cairo, { year: 2026, month: 3, day: 10 }, opts);
    const hm = (d) => formatTime(d, { timeZone: TZ, hour12: false, lang: 'en' });
    expect(hm(t.dhuhr)).toMatch(/^1[12]:/); // noon-ish
    expect(Number(hm(t.fajr).split(':')[0])).toBeLessThanOrEqual(5);
    expect(Number(hm(t.maghrib).split(':')[0])).toBeGreaterThanOrEqual(17);
  });

  it('Hanafi Asr is later than Shafi Asr', () => {
    const day = { year: 2026, month: 6, day: 1 };
    const s = timesForDay(cairo, day, { ...opts, madhab: 'shafi' });
    const h = timesForDay(cairo, day, { ...opts, madhab: 'hanafi' });
    expect(h.asr > s.asr).toBe(true);
    expect(h.dhuhr.getTime()).toBe(s.dhuhr.getTime());
  });

  it('different methods change Fajr/Isha but not Dhuhr', () => {
    const day = { year: 2026, month: 6, day: 1 };
    const egy = timesForDay(cairo, day, { method: 'egyptian' });
    const mwl = timesForDay(cairo, day, { method: 'mwl' });
    expect(egy.fajr.getTime()).not.toBe(mwl.fajr.getTime());
    expect(egy.dhuhr.getTime()).toBe(mwl.dhuhr.getTime());
  });

  it('applies manual minute adjustments', () => {
    const day = { year: 2026, month: 6, day: 1 };
    const base = timesForDay(cairo, day, opts);
    const adj = timesForDay(cairo, day, { ...opts, adjustments: { maghrib: 5 } });
    expect(adj.maghrib.getTime() - base.maghrib.getTime()).toBe(5 * 60000);
    expect(adj.isha.getTime()).toBe(base.isha.getTime());
  });

  it('every listed method computes without throwing', () => {
    for (const method of Object.keys(METHODS)) {
      expect(() => timesForDay(cairo, { year: 2026, month: 1, day: 1 }, { method })).not.toThrow();
    }
  });

  it('rejects unknown methods', () => {
    expect(() => timesForDay(cairo, { year: 2026, month: 1, day: 1 }, { method: 'nope' })).toThrow(/Unknown/);
  });

  it('handles high latitudes (Oslo, midsummer) with valid dates', () => {
    const t = timesForDay({ lat: 59.9139, lng: 10.7522 }, { year: 2026, month: 6, day: 21 }, { method: 'mwl' });
    for (const v of Object.values(t)) expect(Number.isNaN(v.getTime())).toBe(false);
  });
});

describe('calendarDay / addDays', () => {
  it('reads the day in the target zone, not the system zone', () => {
    const instant = new Date('2026-03-10T22:30:00Z'); // already 00:30 on the 11th in Cairo (UTC+2)
    expect(calendarDay(instant, TZ)).toEqual({ year: 2026, month: 3, day: 11 });
    expect(calendarDay(instant, 'America/New_York')).toEqual({ year: 2026, month: 3, day: 10 });
  });
  it('rolls over months and years', () => {
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });
});

describe('nextPrayer / currentPrayer', () => {
  const day = { year: 2026, month: 3, day: 10 };
  const t = timesForDay(cairo, day, opts);

  it('before Fajr -> Fajr', () => {
    const now = new Date(t.fajr.getTime() - 3600000);
    expect(nextPrayer(cairo, now, TZ, opts).name).toBe('fajr');
  });
  it('between Dhuhr and Asr -> Asr, with exact countdown', () => {
    const now = new Date(t.dhuhr.getTime() + 60000);
    const n = nextPrayer(cairo, now, TZ, opts);
    expect(n.name).toBe('asr');
    expect(n.msUntil).toBe(t.asr.getTime() - now.getTime());
  });
  it('exactly at a prayer time the next one is the following prayer', () => {
    expect(nextPrayer(cairo, t.dhuhr, TZ, opts).name).toBe('asr');
  });
  it('after Isha rolls over to tomorrow\'s Fajr', () => {
    const now = new Date(t.isha.getTime() + 60000);
    const n = nextPrayer(cairo, now, TZ, opts);
    const tomorrow = timesForDay(cairo, { year: 2026, month: 3, day: 11 }, opts);
    expect(n.name).toBe('fajr');
    expect(n.at.getTime()).toBe(tomorrow.fajr.getTime());
  });
  it('currentPrayer is null-safe before Fajr (previous Isha) and correct midday', () => {
    expect(currentPrayer(cairo, new Date(t.fajr.getTime() - 60000), TZ, opts).name).toBe('isha');
    expect(currentPrayer(cairo, new Date(t.asr.getTime() + 60000), TZ, opts).name).toBe('asr');
  });
});

describe('formatting', () => {
  it('formats countdowns', () => {
    expect(formatCountdown(12 * 60000, 'en')).toBe('12 m');
    expect(formatCountdown(83 * 60000, 'en')).toBe('1 h 23 m');
    expect(formatCountdown(83 * 60000, 'ar')).toBe('1 س 23 د');
    expect(formatCountdown(-5, 'en')).toBe('0 m');
  });
  it('formats times in a zone', () => {
    expect(formatTime(new Date('2026-03-10T10:05:00Z'), { timeZone: TZ, hour12: false, lang: 'en' })).toBe('12:05');
  });
  it('detects Friday in the location zone', () => {
    expect(isFriday(new Date('2026-03-13T10:00:00Z'), TZ)).toBe(true);
    expect(isFriday(new Date('2026-03-12T10:00:00Z'), TZ)).toBe(false);
  });
});
