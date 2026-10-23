(function () {
  const T = {
    ar: {
      title: 'مواقيت الصلاة والأذكار', next: 'الصلاة القادمة', today: 'مواقيت اليوم', loc: 'الموقع', city: 'المدينة', cityHint: 'اختر مدينة أو أدخل الإحداثيات يدويًا',
      detect: 'تحديد تلقائي (عبر الإنترنت)', detecting: 'جارٍ التحديد…', detectFail: 'تعذّر التحديد، اختر يدويًا', lat: 'خط العرض', lng: 'خط الطول', tz: 'المنطقة الزمنية (auto = جهازك)',
      calc: 'الحساب', method: 'طريقة الحساب', madhab: 'المذهب (العصر)', shafi: 'جمهور (الشافعي/المالكي/الحنبلي)', hanafi: 'حنفي', adj: 'تعديل يدوي بالدقائق',
      notif: 'التنبيهات', pre: 'تنبيه قبل الأذان (بالدقائق، 0 للإيقاف)', atAdhan: 'تنبيه عند دخول الوقت', sound: 'صوت وقت الصلاة', sAdhan: 'الأذان', sChime: 'تنبيه هادئ', sNone: 'بدون صوت', sCustom: 'ملف صوتي مخصص', pick: 'اختيار ملف…', test: 'تجربة تنبيه', testSound: 'تجربة الصوت', stopSound: 'إيقاف', volume: 'مستوى الصوت',
      action: 'عند دخول وقت الصلاة', aNone: 'لا شيء', aAsk: 'اسألني إن كنت أريد قفل الجهاز', aLock: 'اقفل الجهاز تلقائيًا (بعد 15 ثانية قابلة للإلغاء)', aWhich: 'الصلوات', aDelay: 'بعد دخول الوقت بـ', aSnooze: 'التذكير لاحقًا بعد',
      adhkar: 'الأذكار', morning: 'أذكار الصباح (بعد الفجر بـ)', evening: 'أذكار المساء (بعد العصر بـ)', after: 'أذكار بعد الصلاة (بعد الأذان بـ)', min: 'دقيقة', afterWhich: 'الصلوات',
      general: 'عام', language: 'اللغة', h12: 'نظام 12 ساعة', countdown: 'عرض العد التنازلي بجانب الأيقونة', autostart: 'التشغيل مع بدء النظام', saved: 'تم الحفظ تلقائيًا',
      methods: { egyptian: 'الهيئة المصرية العامة للمساحة', mwl: 'رابطة العالم الإسلامي', umm_al_qura: 'أم القرى (مكة)', karachi: 'جامعة العلوم الإسلامية بكراتشي', isna: 'أمريكا الشمالية (ISNA)', dubai: 'دبي', kuwait: 'الكويت', qatar: 'قطر', singapore: 'سنغافورة', turkey: 'ديانت (تركيا)', tehran: 'طهران', moonsighting: 'لجنة رؤية الهلال' },
      custom: 'موقع مخصص',
    },
    en: {
      title: 'Salah Reminder', next: 'Next prayer', today: "Today's times", loc: 'Location', city: 'City', cityHint: 'Pick a city or enter coordinates manually',
      detect: 'Detect automatically (online)', detecting: 'Detecting…', detectFail: 'Could not detect — choose manually', lat: 'Latitude', lng: 'Longitude', tz: 'Time zone (auto = your system)',
      calc: 'Calculation', method: 'Calculation method', madhab: 'Madhab (Asr)', shafi: 'Standard (Shafi/Maliki/Hanbali)', hanafi: 'Hanafi', adj: 'Manual adjustment (minutes)',
      notif: 'Notifications', pre: 'Reminder before adhan (minutes, 0 = off)', atAdhan: 'Notify at prayer time', sound: 'Sound at prayer time', sAdhan: 'Adhan', sChime: 'Soft chime', sNone: 'Silent', sCustom: 'Custom audio file', pick: 'Choose file…', test: 'Test notification', testSound: 'Test sound', stopSound: 'Stop', volume: 'Volume',
      action: 'When prayer time starts', aNone: 'Do nothing', aAsk: 'Ask whether to lock the computer', aLock: 'Lock the computer automatically (15 s cancellable countdown)', aWhich: 'Prayers', aDelay: 'Delay after prayer time', aSnooze: 'Remind again after',
      adhkar: 'Adhkar', morning: 'Morning adhkar (after Fajr by)', evening: 'Evening adhkar (after Asr by)', after: 'Adhkar after prayer (after adhan by)', min: 'min', afterWhich: 'Prayers',
      general: 'General', language: 'Language', h12: '12-hour clock', countdown: 'Show countdown next to the tray icon', autostart: 'Launch at login', saved: 'Saved automatically',
      methods: { egyptian: 'Egyptian General Authority of Survey', mwl: 'Muslim World League', umm_al_qura: 'Umm al-Qura (Makkah)', karachi: 'Univ. of Islamic Sciences, Karachi', isna: 'North America (ISNA)', dubai: 'Dubai', kuwait: 'Kuwait', qatar: 'Qatar', singapore: 'Singapore', turkey: 'Diyanet (Turkey)', tehran: 'Tehran', moonsighting: 'Moonsighting Committee' },
      custom: 'Custom location',
    },
  };
  const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const NAMES = {
    ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  };

  let state, saveTimer;
  const app = document.getElementById('app');

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    for (const k of kids.flat()) if (k != null) n.append(k);
    return n;
  };

  function scheduleSave(statusEl) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      state.settings = await window.salah.save(state.settings);
      const fresh = await window.salah.getState();
      state.summary = fresh.summary;
      renderHero();
      statusEl.textContent = T[state.settings.language].saved;
    }, 350);
  }

  let heroEl;
  function renderHero() {
    const t = T[state.settings.language];
    heroEl.replaceChildren(
      el('div', { textContent: t.next }),
      el('big', { textContent: `${state.summary.next.label} — ${state.summary.next.time}` }),
      el('div', { textContent: `${state.summary.next.countdown} · ${state.settings.location.name}` }),
      el('div', { className: 'times' }, state.summary.rows.map((r) => el('div', { className: 't' + (r.isNext ? ' next' : '') }, el('span', { textContent: r.label }), el('b', { textContent: r.time })))),
    );
    heroEl.querySelectorAll('.t').forEach((n) => { n.style.color = 'var(--ink)'; });
  }

  function render() {
    const s = state.settings;
    const t = T[s.language];
    document.documentElement.lang = s.language;
    document.documentElement.dir = s.language === 'ar' ? 'rtl' : 'ltr';
    document.title = t.title;
    const status = el('span', { className: 'status' });
    const change = (fn) => (e) => { fn(e.target); scheduleSave(status); };

    const row = (label, control, hint) => el('div', { className: 'row' }, el('label', {}, label, hint ? el('small', { textContent: hint }) : null), control);
    const num = (get, set, min, max) => el('input', { type: 'number', min, max, value: get(), onchange: change((i) => set(Number(i.value))) });
    const check = (get, set) => el('input', { type: 'checkbox', checked: get(), onchange: change((i) => set(i.checked)) });
    const select = (opts, current, set) => el('select', { onchange: change((i) => set(i.value)) }, opts.map(([v, l]) => el('option', { value: v, textContent: l, selected: v === current })));

    heroEl = el('div', { className: 'hero' });

    const cityOpts = [['__custom', t.custom], ...state.cities.map((c, i) => [String(i), s.language === 'ar' ? c.ar : c.en])];
    const matchIdx = state.cities.findIndex((c) => c.lat === s.location.lat && c.lng === s.location.lng);
    const citySel = select(cityOpts, matchIdx >= 0 ? String(matchIdx) : '__custom', (v) => {
      if (v === '__custom') return;
      const c = state.cities[Number(v)];
      s.location = { name: s.language === 'ar' ? c.ar : c.en, lat: c.lat, lng: c.lng, timeZone: c.timeZone };
      s.method = c.method;
      render();
    });
    const detectBtn = el('button', { textContent: t.detect, onclick: async (ev) => {
      ev.target.textContent = t.detecting;
      const r = await window.salah.detectLocation();
      if (r.ok) { s.location = r.location; scheduleSave(status); render(); } else { ev.target.textContent = t.detectFail; }
    } });
    const nameInput = el('input', { type: 'text', value: s.location.name, onchange: change((i) => { s.location.name = i.value; }) });

    const adjRows = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => row(NAMES[s.language][k], num(() => s.adjustments[k], (v) => { s.adjustments[k] = v; }, -60, 60)));
    const slotToggle = (label, slot) => el('div', { className: 'row' }, el('label', {}, check(() => slot.enabled, (v) => { slot.enabled = v; }), ' ', label), el('span', {}, num(() => slot.offsetMinutes, (v) => { slot.offsetMinutes = v; }, 0, 180), ' ', t.min));
    const ap = s.adhkar.afterPrayer;
    const chips = el('div', { className: 'chips' }, PRAYERS.map((p) => el('label', {}, check(() => ap.prayers.includes(p), (v) => { ap.prayers = PRAYERS.filter((x) => (x === p ? v : ap.prayers.includes(x))); }), ' ', NAMES[s.language][p])));

    const pa = s.prayerAction;
    const paChips = el('div', { className: 'chips' }, PRAYERS.map((p) => el('label', {}, check(() => pa.prayers.includes(p), (v) => { pa.prayers = PRAYERS.filter((x) => (x === p ? v : pa.prayers.includes(x))); }), ' ', NAMES[s.language][p])));
    const soundPick = el('button', { textContent: t.pick, onclick: async () => { const f = await window.salah.pickSound(); if (f) { s.notifications.customSoundPath = f; s.notifications.sound = 'custom'; scheduleSave(status); render(); } } });

    app.replaceChildren(
      el('h1', { textContent: t.title }), heroEl,
      el('h2', { textContent: t.loc }),
      el('div', { className: 'card' },
        row(t.city, citySel, t.cityHint),
        row('', nameInput),
        row(t.lat, el('input', { type: 'number', step: '0.0001', value: s.location.lat, onchange: change((i) => { s.location.lat = Number(i.value); }) })),
        row(t.lng, el('input', { type: 'number', step: '0.0001', value: s.location.lng, onchange: change((i) => { s.location.lng = Number(i.value); }) })),
        row(t.tz, el('input', { type: 'text', value: s.location.timeZone, onchange: change((i) => { s.location.timeZone = i.value.trim() || 'auto'; }) })),
        el('div', { className: 'row' }, detectBtn)),
      el('h2', { textContent: t.calc }),
      el('div', { className: 'card' },
        row(t.method, select(state.methods.map((m) => [m, t.methods[m]]), s.method, (v) => { s.method = v; })),
        row(t.madhab, select([['shafi', t.shafi], ['hanafi', t.hanafi]], s.madhab, (v) => { s.madhab = v; })),
        el('details', {}, el('summary', { textContent: t.adj }), adjRows)),
      el('h2', { textContent: t.notif }),
      el('div', { className: 'card' },
        row(t.pre, num(() => s.notifications.preAdhanMinutes, (v) => { s.notifications.preAdhanMinutes = v; }, 0, 120)),
        row(t.atAdhan, check(() => s.notifications.atAdhan, (v) => { s.notifications.atAdhan = v; })),
        row(t.sound, select([['adhan', t.sAdhan], ['chime', t.sChime], ['custom', t.sCustom], ['none', t.sNone]], s.notifications.sound, (v) => { s.notifications.sound = v; })),
        row(t.volume, el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.notifications.volume, onchange: change((i) => { s.notifications.volume = Number(i.value); }) })),
        el('div', { className: 'row' }, soundPick,
          el('button', { textContent: t.testSound, onclick: async () => { state.settings = await window.salah.save(s); window.salah.testSound(); } }),
          el('button', { textContent: t.stopSound, onclick: () => window.salah.stopSound() }),
          el('button', { textContent: t.test, onclick: () => window.salah.testNotification() }))),
      el('h2', { textContent: t.action }),
      el('div', { className: 'card' },
        row(t.action, select([['none', t.aNone], ['ask', t.aAsk], ['lock', t.aLock]], pa.mode, (v) => { pa.mode = v; })),
        row(t.aDelay, el('span', {}, num(() => pa.delayMinutes, (v) => { pa.delayMinutes = v; }, 0, 60), ' ', t.min)),
        row(t.aSnooze, el('span', {}, num(() => pa.snoozeMinutes, (v) => { pa.snoozeMinutes = v; }, 1, 60), ' ', t.min)),
        el('div', { className: 'row' }, el('label', { textContent: t.aWhich }), paChips)),
      el('h2', { textContent: t.adhkar }),
      el('div', { className: 'card' },
        slotToggle(t.morning, s.adhkar.morning), slotToggle(t.evening, s.adhkar.evening), slotToggle(t.after, ap),
        el('div', { className: 'row' }, el('label', { textContent: t.afterWhich }), chips)),
      el('h2', { textContent: t.general }),
      el('div', { className: 'card' },
        row(t.language, select([['ar', 'العربية'], ['en', 'English']], s.language, (v) => { s.language = v; render(); })),
        row(t.h12, check(() => s.hour12, (v) => { s.hour12 = v; })),
        row(t.countdown, check(() => s.tray.showCountdown, (v) => { s.tray.showCountdown = v; })),
        row(t.autostart, check(() => s.autostart, (v) => { s.autostart = v; }))),
      el('div', { className: 'actions' }, status),
    );
    renderHero();
  }

  (async () => {
    state = await window.salah.getState();
    render();
    window.salah.onStateChanged(async () => { const fresh = await window.salah.getState(); state.summary = fresh.summary; renderHero(); });
    setInterval(async () => { const fresh = await window.salah.getState(); state.summary = fresh.summary; renderHero(); }, 30000);
  })();
})();
