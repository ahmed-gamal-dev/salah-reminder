'use strict';
const { PRAYERS, calendarDay, addDays, dayKey, timesForDay } = require('./prayer');

const MIN = 60 * 1000;

function engineOptions(settings) {
  return { method: settings.method, madhab: settings.madhab, adjustments: settings.adjustments };
}

/**
 * All reminder events for the days around `now` (yesterday..tomorrow at the location),
 * sorted by time. Pure: same input, same output.
 * Event ids are stable so the runner can de-duplicate.
 */
function buildEvents(now, settings) {
  const { location, notifications, adhkar } = settings;
  const today = calendarDay(now, location.timeZone);
  const events = [];
  const push = (type, key, at, extra = {}) => events.push({ id: `${type}:${key}:${extra.dayKey}`, type, at, ...extra });

  for (const offset of [-1, 0, 1]) {
    const day = addDays(today, offset);
    const dk = dayKey(day);
    const t = timesForDay(location, day, engineOptions(settings));

    for (const prayer of PRAYERS) {
      if (notifications.preAdhanMinutes > 0) {
        push('pre-adhan', prayer, new Date(t[prayer].getTime() - notifications.preAdhanMinutes * MIN), { prayer, dayKey: dk, minutes: notifications.preAdhanMinutes });
      }
      if (notifications.atAdhan) push('adhan', prayer, t[prayer], { prayer, dayKey: dk });
      if (settings.prayerAction.mode !== 'none' && settings.prayerAction.prayers.includes(prayer)) {
        push('prayer-action', prayer, new Date(t[prayer].getTime() + settings.prayerAction.delayMinutes * MIN), { prayer, dayKey: dk, mode: settings.prayerAction.mode });
      }
      if (adhkar.afterPrayer.enabled && adhkar.afterPrayer.prayers.includes(prayer)) {
        push('adhkar', `after-prayer-${prayer}`, new Date(t[prayer].getTime() + adhkar.afterPrayer.offsetMinutes * MIN), { category: 'after-prayer', prayer, dayKey: dk });
      }
    }
    if (adhkar.morning.enabled) push('adhkar', 'morning', new Date(t.fajr.getTime() + adhkar.morning.offsetMinutes * MIN), { category: 'morning', dayKey: dk });
    if (adhkar.evening.enabled) push('adhkar', 'evening', new Date(t.asr.getTime() + adhkar.evening.offsetMinutes * MIN), { category: 'evening', dayKey: dk });
  }
  return events.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

/**
 * Events that became due in (from, to]. Events older than `graceMs` relative to `to`
 * are skipped, so waking from sleep does not replay a pile of stale notifications.
 */
function dueEvents(events, from, to, graceMs = 2 * MIN) {
  return events.filter((e) => e.at > from && e.at <= to && to - e.at <= graceMs);
}

/**
 * Polling runner. `getSettings` is read every tick so setting changes apply immediately.
 * `now`/`setInterval` are injectable for tests.
 */
class Reminder {
  constructor({ getSettings, onEvent, now = () => new Date(), tickMs = 1000, timers = { setInterval, clearInterval } }) {
    this.getSettings = getSettings;
    this.onEvent = onEvent;
    this.now = now;
    this.tickMs = tickMs;
    this.timers = timers;
    this.fired = new Set();
    this.last = null;
    this.handle = null;
    this.cache = { key: null, events: [] };
  }

  events(now, settings) {
    const key = JSON.stringify([settings, calendarDay(now, settings.location.timeZone)]);
    if (this.cache.key !== key) this.cache = { key, events: buildEvents(now, settings) };
    return this.cache.events;
  }

  tick() {
    const now = this.now();
    const settings = this.getSettings();
    const from = this.last || new Date(now.getTime() - this.tickMs);
    this.last = now;
    for (const e of dueEvents(this.events(now, settings), from, now)) {
      if (this.fired.has(e.id)) continue;
      this.fired.add(e.id);
      this.onEvent(e);
    }
    if (this.fired.size > 500) this.fired = new Set([...this.fired].slice(-200));
  }

  start() {
    if (this.handle) return;
    this.tick();
    this.handle = this.timers.setInterval(() => this.tick(), this.tickMs);
  }

  stop() {
    if (this.handle) this.timers.clearInterval(this.handle);
    this.handle = null;
  }
}

module.exports = { buildEvents, dueEvents, Reminder };
