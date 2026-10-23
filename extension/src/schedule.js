'use strict';
// Pure helpers for the extension background; they sit on top of the same core used by the desktop app.
const { buildEvents } = require('../../src/core/scheduler');
const { strings, prayerName, isFriday } = require('../../src/core/i18n');

const HOUR = 3600 * 1000;
const NOTIFY_TYPES = new Set(['pre-adhan', 'adhan', 'adhkar']); // 'prayer-action' (lock) is desktop-only

/** Alarms to register: every future notifiable event inside the horizon. */
function planAlarms(now, settings, horizonMs = 36 * HOUR) {
  const end = now.getTime() + horizonMs;
  return buildEvents(now, settings)
    .filter((e) => NOTIFY_TYPES.has(e.type) && e.at > now && e.at.getTime() <= end)
    .map((e) => ({ name: `ev:${e.id}`, when: e.at.getTime(), id: e.id }));
}

/** Compact toolbar badge: minutes under an hour, hours above. */
function badgeText(msUntil) {
  const min = Math.max(0, Math.ceil(msUntil / 60000));
  return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h`;
}

function notificationFor(event, settings) {
  const lang = settings.language;
  const s = strings(lang);
  const prayer = event.prayer ? prayerName(lang, event.prayer, { friday: isFriday(event.at, settings.location.timeZone) }) : '';
  if (event.type === 'pre-adhan') return { title: s.preAdhanTitle(prayer, event.minutes), message: s.preAdhanBody };
  if (event.type === 'adhan') return { title: s.adhanTitle(prayer), message: s.adhanBody };
  if (event.type === 'adhkar') return { title: s.adhkarTitle[event.category], message: s.adhkarBody, category: event.category };
  return null;
}

module.exports = { planAlarms, badgeText, notificationFor, NOTIFY_TYPES };
