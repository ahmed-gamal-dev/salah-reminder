'use strict';
const { sanitize } = require('../../src/core/settings');
const { buildSummary } = require('../../src/core/summary');
const { strings } = require('../../src/core/i18n');

const api = globalThis.browser || globalThis.chrome;
const app = document.getElementById('app');
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.flat().filter(Boolean)); return n; };

async function render() {
  const { settings: stored } = await api.storage.local.get('settings');
  const settings = sanitize(stored);
  const s = strings(settings.language);
  const sum = buildSummary(new Date(), settings);
  document.documentElement.lang = settings.language;
  document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  const open = (page) => () => api.tabs.create({ url: api.runtime.getURL(page) });

  app.replaceChildren(
    el('div', { className: 'hero' },
      el('div', { textContent: s.next }),
      el('big', { textContent: `${sum.next.label} — ${sum.next.time}` }),
      el('div', { textContent: `${s.in} ${sum.next.countdown} · ${settings.location.name}` })),
    el('div', { className: 'times' }, sum.rows.map((r) => el('div', { className: 't' + (r.isNext ? ' next' : '') }, el('span', { textContent: r.label }), el('b', { textContent: r.time })))),
    el('div', { className: 'links' },
      ['morning', 'evening', 'after-prayer'].map((c) => el('button', { textContent: s.categories[c], onclick: open(`adhkar.html?category=${c}`) })),
      el('button', { textContent: s.menu.settings, onclick: () => api.runtime.openOptionsPage() })),
  );
}

render();
setInterval(render, 15 * 1000);
