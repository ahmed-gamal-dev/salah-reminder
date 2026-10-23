'use strict';
const { sanitize } = require('../../src/core/settings');
const { strings } = require('../../src/core/i18n');
const adhkar = require('../../data/adhkar.json').categories; // same data file the desktop app uses

const api = globalThis.browser || globalThis.chrome;
const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

(async () => {
  const category = new URLSearchParams(location.search).get('category');
  const items = adhkar[category] || [];
  const { settings: stored } = await api.storage.local.get('settings');
  const settings = sanitize(stored);
  const s = strings(settings.language);
  document.documentElement.lang = settings.language;
  document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  document.title = s.categories[category] || s.menu.adhkar;
  const app = document.getElementById('app');
  app.append(el('h1', { textContent: document.title }));

  for (const item of items) {
    const card = el('div', { className: 'card dhikr' });
    card.append(el('div', { className: 'ar', textContent: item.ar }));
    if (settings.language === 'en') card.append(el('div', { className: 'en', textContent: item.en }));
    card.append(el('div', { className: 'src', dir: 'auto', textContent: `${s.source}: ${item.source}` }));
    let left = item.repeat;
    const btn = el('button', { className: 'primary' });
    const draw = () => { btn.textContent = left > 0 ? `${s.repeat} ${left}` : s.done; card.classList.toggle('done', left === 0); };
    btn.addEventListener('click', () => { if (left > 0) { left -= 1; draw(); } });
    draw();
    const counter = el('div', { className: 'counter' });
    counter.append(btn);
    card.append(counter);
    app.append(card);
  }
})();
