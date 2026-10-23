window.salah.onPlaySound((url) => {
  new Audio(url).play().catch(() => {});
});
