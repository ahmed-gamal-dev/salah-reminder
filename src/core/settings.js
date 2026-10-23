'use strict';
const { METHODS, PRAYERS } = require('./prayer');

const DEFAULTS = Object.freeze({
  language: 'ar',
  location: { name: 'القاهرة', lat: 30.0444, lng: 31.2357, timeZone: 'Africa/Cairo' },
  method: 'egyptian',
  madhab: 'shafi',
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  hour12: true,
  notifications: {
    preAdhanMinutes: 10, // 0 disables
    atAdhan: true,
    sound: 'adhan', // played at prayer time: 'adhan' | 'chime' | 'custom' | 'none'
    volume: 0.8, // 0..1
    customSoundPath: '',
  },
  // What to do when prayer time starts: nothing, ask whether to lock the computer, or lock it (after a short cancellable countdown).
  prayerAction: { mode: 'none', prayers: [...PRAYERS], delayMinutes: 0, snoozeMinutes: 5 },
  adhkar: {
    morning: { enabled: true, offsetMinutes: 30 }, // after Fajr
    evening: { enabled: true, offsetMinutes: 15 }, // after Asr
    afterPrayer: { enabled: true, offsetMinutes: 3, prayers: [...PRAYERS] },
  },
  tray: { showCountdown: true },
  autostart: true,
});

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const num = (v, min, max, fallback) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 1e6) / 1e6)) : fallback);
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

function isValidTimeZone(tz) {
  if (tz === 'auto') return true;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return typeof tz === 'string' && tz.length > 0;
  } catch {
    return false;
  }
}

/** Merge arbitrary stored/user input over defaults, dropping anything invalid. Always returns a complete, safe settings object. */
function sanitize(input) {
  const s = isObj(input) ? input : {};
  const d = DEFAULTS;
  const loc = isObj(s.location) ? s.location : {};
  const adj = isObj(s.adjustments) ? s.adjustments : {};
  const n = isObj(s.notifications) ? s.notifications : {};
  const a = isObj(s.adhkar) ? s.adhkar : {};
  const slot = (key) => {
    const v = isObj(a[key]) ? a[key] : {};
    return { enabled: bool(v.enabled, d.adhkar[key].enabled), offsetMinutes: num(v.offsetMinutes, 0, 180, d.adhkar[key].offsetMinutes) };
  };
  const pa = isObj(s.prayerAction) ? s.prayerAction : {};
  const ap = isObj(a.afterPrayer) ? a.afterPrayer : {};
  return {
    language: pick(s.language, ['ar', 'en'], d.language),
    location: {
      name: typeof loc.name === 'string' && loc.name.trim() ? loc.name.trim().slice(0, 80) : d.location.name,
      lat: num(loc.lat, -90, 90, d.location.lat),
      lng: num(loc.lng, -180, 180, d.location.lng),
      timeZone: isValidTimeZone(loc.timeZone) ? loc.timeZone : d.location.timeZone,
    },
    method: pick(s.method, Object.keys(METHODS), d.method),
    madhab: pick(s.madhab, ['shafi', 'hanafi'], d.madhab),
    adjustments: Object.fromEntries(Object.keys(d.adjustments).map((k) => [k, num(adj[k], -60, 60, 0)])),
    hour12: bool(s.hour12, d.hour12),
    notifications: {
      preAdhanMinutes: num(n.preAdhanMinutes, 0, 120, d.notifications.preAdhanMinutes),
      atAdhan: bool(n.atAdhan, d.notifications.atAdhan),
      sound: pick(n.sound, ['adhan', 'chime', 'custom', 'none'], d.notifications.sound),
      volume: num(n.volume, 0, 1, d.notifications.volume),
      customSoundPath: typeof n.customSoundPath === 'string' ? n.customSoundPath : '',
    },
    adhkar: {
      morning: slot('morning'),
      evening: slot('evening'),
      afterPrayer: {
        ...slot('afterPrayer'),
        prayers: Array.isArray(ap.prayers) ? PRAYERS.filter((p) => ap.prayers.includes(p)) : [...d.adhkar.afterPrayer.prayers],
      },
    },
    prayerAction: {
      mode: pick(pa.mode, ['none', 'ask', 'lock'], d.prayerAction.mode),
      prayers: Array.isArray(pa.prayers) ? PRAYERS.filter((p) => pa.prayers.includes(p)) : [...d.prayerAction.prayers],
      delayMinutes: num(pa.delayMinutes, 0, 60, d.prayerAction.delayMinutes),
      snoozeMinutes: num(pa.snoozeMinutes, 1, 60, d.prayerAction.snoozeMinutes),
    },
    tray: { showCountdown: bool(isObj(s.tray) ? s.tray.showCountdown : undefined, d.tray.showCountdown) },
    autostart: bool(s.autostart, d.autostart),
  };
}

module.exports = { DEFAULTS, sanitize, isValidTimeZone };
