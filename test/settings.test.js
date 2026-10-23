import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { sanitize, DEFAULTS } = require('../src/core/settings');
const { loadAdhkar, validateAdhkar } = require('../src/core/adhkar');
const cities = require('../data/cities.json');
const { METHODS } = require('../src/core/prayer');

describe('sanitize', () => {
  it('returns defaults for garbage input', () => {
    expect(sanitize(null)).toEqual(sanitize({}));
    expect(sanitize('x')).toEqual(sanitize(undefined));
    expect(sanitize({}).method).toBe(DEFAULTS.method);
  });
  it('clamps and rejects invalid values', () => {
    const s = sanitize({ location: { lat: 999, lng: 'x', timeZone: 'Mars/Base' }, method: 'bogus', language: 'fr', notifications: { preAdhanMinutes: -5 } });
    expect(s.location.lat).toBe(90);
    expect(s.location.lng).toBe(DEFAULTS.location.lng);
    expect(s.location.timeZone).toBe(DEFAULTS.location.timeZone);
    expect(s.method).toBe('egyptian');
    expect(s.language).toBe('ar');
    expect(s.notifications.preAdhanMinutes).toBe(0);
  });
  it('keeps valid user choices', () => {
    const s = sanitize({ language: 'en', method: 'umm_al_qura', madhab: 'hanafi', location: { name: 'Riyadh', lat: 24.7, lng: 46.7, timeZone: 'auto' }, adhkar: { afterPrayer: { prayers: ['fajr', 'isha', 'zzz'] } } });
    expect(s).toMatchObject({ language: 'en', method: 'umm_al_qura', madhab: 'hanafi' });
    expect(s.location.timeZone).toBe('auto');
    expect(s.adhkar.afterPrayer.prayers).toEqual(['fajr', 'isha']);
  });
  it('is idempotent', () => {
    const once = sanitize({ language: 'en', adjustments: { fajr: 3 } });
    expect(sanitize(once)).toEqual(once);
  });
});

describe('bundled data', () => {
  it('adhkar are complete and valid', () => {
    expect(validateAdhkar(loadAdhkar())).toEqual([]);
  });
  it('every city has valid coordinates, zone and a known method', () => {
    for (const c of cities) {
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.lng)).toBeLessThanOrEqual(180);
      expect(sanitize({ location: { name: 'x', ...c } }).location.timeZone).toBe(c.timeZone);
      expect(METHODS[c.method]).toBeTypeOf('function');
    }
  });
});

describe('prayerAction + sound settings', () => {
  it('defaults to doing nothing and playing the adhan at 80%', () => {
    const s = sanitize({});
    expect(s.prayerAction.mode).toBe('none');
    expect(s.notifications.sound).toBe('adhan');
    expect(s.notifications.volume).toBe(0.8);
  });
  it('validates mode, prayers, delays and volume', () => {
    const s = sanitize({ prayerAction: { mode: 'lock', prayers: ['isha', 'x'], delayMinutes: 999, snoozeMinutes: 0 }, notifications: { volume: 4, sound: 'default' } });
    expect(s.prayerAction).toEqual({ mode: 'lock', prayers: ['isha'], delayMinutes: 60, snoozeMinutes: 1 });
    expect(s.notifications.volume).toBe(1);
    expect(s.notifications.sound).toBe('adhan'); // legacy/unknown value falls back
    expect(sanitize({ prayerAction: { mode: 'explode' } }).prayerAction.mode).toBe('none');
  });
});
