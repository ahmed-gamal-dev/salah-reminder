const $ = (id) => document.getElementById(id);
let mode = 'compact';
let rowsKey = '';
const island = $('island');
let layout = null;
let pointer = { x: -1, y: -1 };
let interactive = null;
let frame = null;
let animationUntil = 0;
function checkHit() {
  frame = null;
  if (!layout) return;
  const rect = island.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(island).borderBottomLeftRadius) || 0;
  const on = document.visibilityState === 'visible' && window.SalahIslandGeometry.hitTest(pointer.x, pointer.y, rect, radius, layout.gap, layout.header);
  if (on !== interactive) { interactive = on; window.banner.interactive(on); }
  if (performance.now() < animationUntil) frame = requestAnimationFrame(checkHit);
}
function scheduleHit() { if (frame === null) frame = requestAnimationFrame(checkHit); }
document.addEventListener('mousemove', (event) => { pointer = { x: event.clientX, y: event.clientY }; scheduleHit(); });
document.addEventListener('mouseleave', () => { pointer = { x: -1, y: -1 }; scheduleHit(); });
document.addEventListener('visibilitychange', scheduleHit);
window.banner.onContent((data) => {
  const changed = mode !== data.mode;
  const focusWasInDetails = $('details').contains(document.activeElement);
  mode = data.mode;
  layout = data.layout;
  pointer = data.cursor;
  for (const [key, value] of Object.entries({ 'island-w': layout.width, 'island-h': layout.height, 'camera-gap': layout.gap, 'header-h': layout.header, radius: layout.radius })) {
    document.body.style.setProperty(`--${key}`, `${value}px`);
  }
  document.body.dataset.playing = String(data.playing);
  $('playing-indicator').hidden = !data.playing || mode === 'compact';
  if (changed && !matchMedia('(prefers-reduced-motion: reduce)').matches) animationUntil = performance.now() + 500;
  scheduleHit();
  document.documentElement.lang = data.language;
  document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.mode = mode;
  $('next').textContent = data.next;
  $('countdown').textContent = data.countdown;
  $('toggle').setAttribute('aria-label', `${data.nextLabel}: ${data.next}. ${data.today}`);
  $('toggle').setAttribute('aria-expanded', String(mode !== 'compact'));
  $('toggle-name').setAttribute('aria-expanded', String(mode !== 'compact'));
  $('toggle-name').setAttribute('aria-label', `${data.nextLabel}: ${data.next}. ${data.today}`);
  $('details').inert = mode === 'compact';
  $('details').setAttribute('aria-hidden', String(mode === 'compact'));
  if (mode !== 'compact') {
    $('today-panel').hidden = mode !== 'today';
    $('alert-panel').hidden = mode !== 'alert';
  }
  $('today-title').textContent = data.today;
  $('location').textContent = data.location;
  if (mode !== 'compact') {
    $('title').textContent = data.title;
    $('body').textContent = data.body;
    $('open').textContent = mode === 'today' ? data.settings : data.open;
  }
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
for (const id of ['toggle', 'toggle-name']) $(id).addEventListener('click', () => window.banner.toggleToday());
$('open').addEventListener('click', () => window.banner.open());
for (const id of ['stop', 'quick-stop']) $(id).addEventListener('click', () => window.banner.stop());
$('dismiss').addEventListener('click', () => window.banner.dismiss());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') window.banner.dismiss(); });
