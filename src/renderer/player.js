let audio = null;

window.salah.onPlaySound(({ url, volume }) => {
  if (audio) audio.pause();
  audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));
  audio.addEventListener('ended', () => window.salah.soundEnded());
  audio.addEventListener('error', () => window.salah.soundEnded());
  audio.addEventListener('playing', () => window.salah.soundStarted({ duration: audio.duration, volume: audio.volume }), { once: true });
  audio.play().catch(() => window.salah.soundEnded());
});

window.salah.onStopSound(() => {
  if (audio) audio.pause();
  audio = null;
});
