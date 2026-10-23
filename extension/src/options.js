'use strict';
const { sanitize } = require('../../src/core/settings');
const { METHODS } = require('../../src/core/prayer');
const { strings } = require('../../src/core/i18n');
const cities = require('../../data/cities.json'); // shared with the desktop app

const api = globalThis.browser || globalThis.chrome;
const L = {
  ar: { title: 'الإعدادات', city: 'المدينة', custom: 'موقع مخصص', lat: 'خط العرض', lng: 'خط الطول', tz: 'المنطقة الزمنية', method: 'طريقة الحساب', madhab: 'المذهب (العصر)', shafi: 'جمهور', hanafi: 'حنفي', language: 'اللغة', h12: 'نظام 12 ساعة', pre: 'تنبيه قبل الأذان (دقائق، 0 للإيقاف)', atAdhan: 'تنبيه عند الأذان', morning: 'أذكار الصباح', evening: 'أذكار المساء', after: 'أذكار بعد الصلاة', saved: 'تم الحفظ' },
  en: { title: 'Settings', city: 'City', custom: 'Custom location', lat: 'Latitude', lng: 'Longitude', tz: 'Time zone', method: 'Calculation method', madhab: 'Madhab (Asr)', shafi: 'Standard', hanafi: 'Hanafi', language: 'Language', h12: '12-hour clock', pre: 'Notify before adhan (minutes, 0 = off)', atAdhan: 'Notify at adhan', morning: 'Morning adhkar', evening: 'Evening adhkar', after: 'Adhkar after prayer', saved: 'Saved' },
};
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.flat().filter(Boolean)); return n; };

(async () => {
  const { settings: stored } = await api.storage.local.get('settings');
  let s = sanitize(stored);
  const app = document.getElementById('app');
  const status = el('span', { className: 'status' });
  let timer;
  const save = () => { clearTimeout(timer); timer = setTimeout(async () => { s = sanitize(s); await api.storage.local.set({ settings: s }); status.textContent = L[s.language].saved; }, 300); };

  function render() {
    const t = L[s.language];
    const m = strings(s.language).methods;
    document.documentElement.lang = s.language;
    document.documentElement.dir = s.language === 'ar' ? 'rtl' : 'ltr';
    const row = (label, control) => el('div', { className: 'row' }, el('label', { textContent: label }), control);
    const on = (fn) => (e) => { fn(e.target); save(); };
    const select = (opts, cur, set) => el('select', { onchange: on((i) => set(i.value)) }, opts.map(([v, l]) => el('option', { value: v, textContent: l, selected: v === cur })));
    const num = (get, set, min, max, step = 1) => el('input', { type: 'number', min, max, step, value: get(), onchange: on((i) => set(Number(i.value))) });
    const check = (get, set) => el('input', { type: 'checkbox', checked: get(), onchange: on((i) => set(i.checked)) });

    const idx = cities.findIndex((c) => c.lat === s.location.lat && c.lng === s.location.lng);
    app.replaceChildren(
      el('h1', { textContent: t.title }),
      el('div', { className: 'card' },
        row(t.city, select([['__c', t.custom], ...cities.map((c, i) => [String(i), s.language === 'ar' ? c.ar : c.en])], idx >= 0 ? String(idx) : '__c', (v) => {
          if (v === '__c') return;
          const c = cities[Number(v)];
          s.location = { name: s.language === 'ar' ? c.ar : c.en, lat: c.lat, lng: c.lng, timeZone: c.timeZone };
          s.method = c.method;
          render();
        })),
        row(t.lat, num(() => s.location.lat, (v) => { s.location.lat = v; }, -90, 90, 0.0001)),
        row(t.lng, num(() => s.location.lng, (v) => { s.location.lng = v; }, -180, 180, 0.0001)),
        row(t.tz, el('input', { type: 'text', value: s.location.timeZone, onchange: on((i) => { s.location.timeZone = i.value.trim() || 'auto'; }) })),
        row(t.method, select(Object.keys(METHODS).map((k) => [k, m[k]]), s.method, (v) => { s.method = v; })),
        row(t.madhab, select([['shafi', t.shafi], ['hanafi', t.hanafi]], s.madhab, (v) => { s.madhab = v; })),
        row(t.language, select([['ar', 'العربية'], ['en', 'English']], s.language, (v) => { s.language = v; render(); })),
        row(t.h12, check(() => s.hour12, (v) => { s.hour12 = v; }))),
      el('h2', { textContent: '🔔' }),
      el('div', { className: 'card' },
        row(t.pre, num(() => s.notifications.preAdhanMinutes, (v) => { s.notifications.preAdhanMinutes = v; }, 0, 120)),
        row(t.atAdhan, check(() => s.notifications.atAdhan, (v) => { s.notifications.atAdhan = v; })),
        row(t.morning, check(() => s.adhkar.morning.enabled, (v) => { s.adhkar.morning.enabled = v; })),
        row(t.evening, check(() => s.adhkar.evening.enabled, (v) => { s.adhkar.evening.enabled = v; })),
        row(t.after, check(() => s.adhkar.afterPrayer.enabled, (v) => { s.adhkar.afterPrayer.enabled = v; }))),
      el('div', { className: 'actions' }, status),
    );
  }
  render();
})();
