'use strict';

const STRINGS = {
  ar: {
    app: 'مواقيت الصلاة والأذكار',
    prayers: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    jumuah: 'الجمعة',
    next: 'الصلاة القادمة',
    in: 'بعد',
    hourShort: 'س',
    minuteShort: 'د',
    preAdhanTitle: (p, m) => `${p} بعد ${m} دقيقة`,
    preAdhanBody: 'استعد للصلاة',
    adhanTitle: (p) => `حان الآن موعد أذان ${p}`,
    adhanBody: 'حيَّ على الصلاة',
    adhkarTitle: { morning: 'أذكار الصباح', evening: 'أذكار المساء', 'after-prayer': 'أذكار بعد الصلاة' },
    adhkarBody: 'اضغط لقراءة الأذكار',
    categories: { morning: 'أذكار الصباح', evening: 'أذكار المساء', 'after-prayer': 'أذكار بعد الصلاة' },
    menu: { settings: 'الإعدادات…', adhkar: 'الأذكار', quit: 'إنهاء', today: 'مواقيت اليوم' },
    methods: { egyptian: 'الهيئة المصرية العامة للمساحة', mwl: 'رابطة العالم الإسلامي', umm_al_qura: 'أم القرى (مكة)', karachi: 'جامعة العلوم الإسلامية بكراتشي', isna: 'أمريكا الشمالية (ISNA)', dubai: 'دبي', kuwait: 'الكويت', qatar: 'قطر', singapore: 'سنغافورة', turkey: 'ديانت (تركيا)', tehran: 'طهران', moonsighting: 'لجنة رؤية الهلال' },
    stopAdhan: 'إيقاف الصوت',
    lockAskTitle: (p) => `دخل وقت ${p}`,
    lockAskBody: 'هل تريد قفل الجهاز الآن للصلاة؟',
    lockNow: 'قفل الجهاز',
    remindIn: (m) => `ذكّرني بعد ${m} دقيقة`,
    dismiss: 'لاحقًا',
    lockCountdownTitle: (p) => `دخل وقت ${p}`,
    lockCountdownBody: (sec) => `سيُقفل الجهاز خلال ${sec} ثانية`,
    cancel: 'إلغاء',
    lockFailed: 'تعذّر قفل الجهاز',
    repeat: 'التكرار',
    done: 'تم',
    source: 'المصدر',
  },
  en: {
    app: 'Salah Reminder',
    prayers: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    jumuah: "Jumu'ah",
    next: 'Next prayer',
    in: 'in',
    hourShort: 'h',
    minuteShort: 'm',
    preAdhanTitle: (p, m) => `${p} in ${m} minutes`,
    preAdhanBody: 'Get ready for prayer',
    adhanTitle: (p) => `It is time for ${p}`,
    adhanBody: 'Hasten to prayer',
    adhkarTitle: { morning: 'Morning adhkar', evening: 'Evening adhkar', 'after-prayer': 'Adhkar after prayer' },
    adhkarBody: 'Click to read the adhkar',
    categories: { morning: 'Morning adhkar', evening: 'Evening adhkar', 'after-prayer': 'Adhkar after prayer' },
    menu: { settings: 'Settings…', adhkar: 'Adhkar', quit: 'Quit', today: "Today's times" },
    methods: { egyptian: 'Egyptian General Authority of Survey', mwl: 'Muslim World League', umm_al_qura: 'Umm al-Qura (Makkah)', karachi: 'Univ. of Islamic Sciences, Karachi', isna: 'North America (ISNA)', dubai: 'Dubai', kuwait: 'Kuwait', qatar: 'Qatar', singapore: 'Singapore', turkey: 'Diyanet (Turkey)', tehran: 'Tehran', moonsighting: 'Moonsighting Committee' },
    stopAdhan: 'Stop sound',
    lockAskTitle: (p) => `${p} time has started`,
    lockAskBody: 'Lock the computer now for prayer?',
    lockNow: 'Lock computer',
    remindIn: (m) => `Remind me in ${m} min`,
    dismiss: 'Later',
    lockCountdownTitle: (p) => `${p} time has started`,
    lockCountdownBody: (sec) => `The computer will lock in ${sec} seconds`,
    cancel: 'Cancel',
    lockFailed: 'Could not lock the computer',
    repeat: 'Repeat',
    done: 'Done',
    source: 'Source',
  },
};

function strings(lang) {
  return STRINGS[lang] || STRINGS.ar;
}

/** Prayer display name; Dhuhr is shown as Jumu'ah on Fridays (in the location's zone). */
function prayerName(lang, prayer, { friday = false } = {}) {
  const s = strings(lang);
  return prayer === 'dhuhr' && friday ? s.jumuah : s.prayers[prayer];
}

function formatTime(date, { timeZone = 'auto', hour12 = true, lang = 'ar' } = {}) {
  const opts = { hour: 'numeric', minute: '2-digit', hour12 };
  if (timeZone && timeZone !== 'auto') opts.timeZone = timeZone;
  // Latin digits keep the tray title compact and aligned in both languages.
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', opts).format(date);
}

/** "1:05" style countdown (h:mm), or "12" minutes-only when under an hour: always ASCII digits. */
function formatCountdown(ms, lang = 'ar') {
  const s = strings(lang);
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} ${s.minuteShort}`;
  return `${h} ${s.hourShort} ${m} ${s.minuteShort}`;
}

function isFriday(date, timeZone = 'auto') {
  const opts = { weekday: 'short' };
  if (timeZone && timeZone !== 'auto') opts.timeZone = timeZone;
  return new Intl.DateTimeFormat('en-US', opts).format(date) === 'Fri';
}

module.exports = { strings, prayerName, formatTime, formatCountdown, isFriday };
