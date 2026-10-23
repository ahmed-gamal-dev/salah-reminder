window.banner.onContent((data) => {
  document.documentElement.lang = data.language;
  document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr';
  for (const key of ['title', 'body', 'open', 'stop', 'dismiss']) document.getElementById(key).textContent = data[key];
  document.getElementById('stop').hidden = !data.sound;
});
document.getElementById('open').addEventListener('click', () => window.banner.open());
document.getElementById('stop').addEventListener('click', () => window.banner.stop());
document.getElementById('dismiss').addEventListener('click', () => window.banner.dismiss());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') window.banner.dismiss(); });
