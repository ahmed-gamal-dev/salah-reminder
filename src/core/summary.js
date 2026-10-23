'use strict';
const { PRAYERS, ALL_TIMES, calendarDay, timesForDay, nextPrayer } = require('./prayer');
const { strings, prayerName, formatTime, formatCountdown, isFriday } = require('./i18n');

function engineOptions(s) {
  return { method: s.method, madhab: s.madhab, adjustments: s.adjustments };
}

/** Everything the tray needs for one moment in time: title, tooltip and today's rows. */
function buildSummary(now, settings) {
  const { language: lang, location, hour12 } = settings;
  const tz = location.timeZone;
  const opts = engineOptions(settings);
  const next = nextPrayer(location, now, tz, opts);
  const today = timesForDay(location, calendarDay(now, tz), opts);
  const fmt = (d) => formatTime(d, { timeZone: tz, hour12, lang });
  const nameOf = (p, at) => prayerName(lang, p, { friday: isFriday(at, tz) });

  const rows = ALL_TIMES.map((key) => ({
    key,
    label: nameOf(key, today[key]),
    time: fmt(today[key]),
    isNext: key === next.name && next.at.getTime() === today[key].getTime(),
    isPrayer: PRAYERS.includes(key),
  }));

  const nextName = nameOf(next.name, next.at);
  const countdown = formatCountdown(next.msUntil, lang);
  const s = strings(lang);
  return {
    next: { ...next, label: nextName, time: fmt(next.at), countdown },
    rows,
    trayTitle: settings.tray.showCountdown ? `${nextName} ${countdown}` : '',
    tooltip: `${s.next}: ${nextName} ${fmt(next.at)} (${s.in} ${countdown})\n${location.name}`,
  };
}

module.exports = { buildSummary };
