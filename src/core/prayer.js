'use strict';
const adhan = require('adhan');

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ALL_TIMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const METHODS = {
  egyptian: () => adhan.CalculationMethod.Egyptian(),
  mwl: () => adhan.CalculationMethod.MuslimWorldLeague(),
  umm_al_qura: () => adhan.CalculationMethod.UmmAlQura(),
  karachi: () => adhan.CalculationMethod.Karachi(),
  isna: () => adhan.CalculationMethod.NorthAmerica(),
  dubai: () => adhan.CalculationMethod.Dubai(),
  kuwait: () => adhan.CalculationMethod.Kuwait(),
  qatar: () => adhan.CalculationMethod.Qatar(),
  singapore: () => adhan.CalculationMethod.Singapore(),
  turkey: () => adhan.CalculationMethod.Turkey(),
  tehran: () => adhan.CalculationMethod.Tehran(),
  moonsighting: () => adhan.CalculationMethod.MoonsightingCommittee(),
};

const MADHABS = { shafi: adhan.Madhab.Shafi, hanafi: adhan.Madhab.Hanafi };

/** Calendar day (y, m, d) of an instant as seen in `timeZone` ('auto' = system zone). */
function calendarDay(date, timeZone = 'auto') {
  const opts = { year: 'numeric', month: 'numeric', day: 'numeric' };
  if (timeZone && timeZone !== 'auto') opts.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function addDays({ year, month, day }, n) {
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function buildParams({ method = 'egyptian', madhab = 'shafi', adjustments = {} } = {}) {
  const factory = METHODS[method];
  if (!factory) throw new Error(`Unknown calculation method: ${method}`);
  const params = factory();
  params.madhab = MADHABS[madhab] || adhan.Madhab.Shafi;
  params.adjustments = { ...params.adjustments };
  for (const key of ALL_TIMES) {
    if (typeof adjustments[key] === 'number') params.adjustments[key] = (params.adjustments[key] || 0) + adjustments[key];
  }
  return params;
}

/**
 * Prayer times for one calendar day at a location.
 * @param {{lat:number,lng:number}} location
 * @param {{year:number,month:number,day:number}} day calendar day at the location
 * @returns {{fajr:Date,sunrise:Date,dhuhr:Date,asr:Date,maghrib:Date,isha:Date}}
 */
function timesForDay(location, day, options = {}) {
  const coords = new adhan.Coordinates(location.lat, location.lng);
  const params = buildParams(options);
  if (options.highLatitudeRule !== false) params.highLatitudeRule = adhan.HighLatitudeRule.recommended(coords);
  // adhan reads the date with local getters, so a local-midnight Date of the wanted calendar day is correct.
  const t = new adhan.PrayerTimes(coords, new Date(day.year, day.month - 1, day.day), params);
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

function dayKey({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function timesForDate(location, date, timeZone, options) {
  return timesForDay(location, calendarDay(date, timeZone), options);
}

/** Next of the five prayers strictly after `now` (rolls over to tomorrow's Fajr after Isha). */
function nextPrayer(location, now, timeZone, options) {
  const today = calendarDay(now, timeZone);
  for (let offset = 0; offset <= 1; offset++) {
    const times = timesForDay(location, addDays(today, offset), options);
    for (const name of PRAYERS) {
      if (times[name] > now) return { name, at: times[name], msUntil: times[name] - now };
    }
  }
  /* istanbul ignore next */ throw new Error('No upcoming prayer found');
}

/** The prayer currently in effect (last one that started), or null before today's Fajr. */
function currentPrayer(location, now, timeZone, options) {
  const today = calendarDay(now, timeZone);
  let found = null;
  for (const offset of [-1, 0]) {
    const times = timesForDay(location, addDays(today, offset), options);
    for (const name of PRAYERS) if (times[name] <= now) found = { name, at: times[name] };
  }
  return found;
}

module.exports = { PRAYERS, ALL_TIMES, METHODS, calendarDay, addDays, dayKey, buildParams, timesForDay, timesForDate, nextPrayer, currentPrayer };
