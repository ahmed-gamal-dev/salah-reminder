const $ = (id) => document.getElementById(id);
let mode = 'compact';
let rowsKey = '';
window.banner.onContent((data) => {
  const changed = mode !== data.mode;
  const focusWasInDetails = $('details').contains(document.activeElement);
  mode = data.mode;
  document.documentElement.lang = data.language;
  document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.mode = mode;
  $('next').textContent = data.next;
  $('countdown').textContent = data.countdown;
  $('toggle').setAttribute('aria-label', `${data.nextLabel}: ${data.next}. ${data.today}`);
  $('toggle').setAttribute('aria-expanded', String(mode !== 'compact'));
  $('details').hidden = mode === 'compact';
  $('today-panel').hidden = mode !== 'today';
  $('alert-panel').hidden = mode !== 'alert';
  $('today-title').textContent = data.today;
  $('location').textContent = data.location;
  $('title').textContent = data.title;
  $('body').textContent = data.body;
  $('open').textContent = mode === 'today' ? data.settings : data.open;
  $('stop').textContent = data.stop;
  $('quick-stop').textContent = '■';
  $('quick-stop').setAttribute('aria-label', data.stop);
  $('quick-stop').title = data.stop;
  $('stop').hidden = !data.playing;
  $('quick-stop').hidden = !data.playing || mode !== 'compact';
  $('dismiss').textContent = data.dismiss;
  const key = JSON.stringify(data.rows);
  if (key !== rowsKey) {
    rowsKey = key;
    $('times').replaceChildren(...data.rows.map((r) => {
      const li = document.createElement('li');
      li.className = (r.isNext ? 'is-next ' : '') + (r.key === 'sunrise' ? 'sunrise' : '');
      const name = document.createElement('span'); name.textContent = r.label;
      const time = document.createElement('time'); time.textContent = r.time;
      li.append(name, time); return li;
    }));
  }
  // Keyboard focus returns to the summary when collapsing a panel containing focused buttons.
  if (changed && mode === 'compact' && focusWasInDetails) $('toggle').focus();
});
$('toggle').addEventListener('click', () => window.banner.toggleToday());
$('open').addEventListener('click', () => window.banner.open());
for (const id of ['stop', 'quick-stop']) $(id).addEventListener('click', () => window.banner.stop());
$('dismiss').addEventListener('click', () => window.banner.dismiss());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') window.banner.dismiss(); });
