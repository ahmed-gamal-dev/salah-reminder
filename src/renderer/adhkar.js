(async function () {
  const category = new URLSearchParams(location.search).get('category');
  const state = await window.salah.getState();
  const items = await window.salah.getAdhkar(category);
  const lang = state.settings.language;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const app = document.getElementById('app');

  const h1 = document.createElement('h1');
  h1.textContent = state.strings.categories[category];
  app.appendChild(h1);

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'card dhikr';
    const ar = Object.assign(document.createElement('div'), { className: 'ar', textContent: item.ar });
    card.appendChild(ar);
    if (lang === 'en') card.appendChild(Object.assign(document.createElement('div'), { className: 'en', textContent: item.en }));
    card.appendChild(Object.assign(document.createElement('div'), { className: 'src', dir: 'auto', textContent: `${state.strings.source}: ${item.source}` }));

    const counter = document.createElement('div');
    counter.className = 'counter';
    let left = item.repeat;
    const btn = document.createElement('button');
    btn.className = 'primary';
    const render = () => {
      btn.textContent = left > 0 ? `${state.strings.repeat} ${left}` : state.strings.done;
      card.classList.toggle('done', left === 0);
    };
    btn.addEventListener('click', () => { if (left > 0) { left -= 1; render(); } });
    render();
    counter.appendChild(btn);
    card.appendChild(counter);
    app.appendChild(card);
  }
})();
