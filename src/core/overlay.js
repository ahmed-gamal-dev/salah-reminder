'use strict';

function countdownClock(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((n) => String(n).padStart(2, '0')).join(':');
}

const { islandLayout } = require('./island-geometry');

// The native window stays fixed; the black surface animates inside it.
function overlayBounds(display, mode = 'compact', metrics) {
  return islandLayout(display, metrics, mode).window;
}

/** State transitions are independent of Electron and the renderer. */
class OverlayState {
  constructor() { this.enabled = false; this.view = 'compact'; this.alert = null; this.until = 0; this.playing = false; }
  configure(enabled) {
    if (this.enabled && !enabled) this.collapse();
    this.enabled = enabled;
  }
  notify(payload, now) { this.alert = payload; this.view = 'alert'; this.until = now + 15000; }
  playback(active) {
    if (this.playing && !active && this.view === 'alert' && this.alert?.sound) this.collapse();
    this.playing = active;
  }
  tick(now) {
    if (this.view === 'alert' && now >= this.until && !(this.alert?.sound && this.playing)) this.collapse();
  }
  toggleToday() { if (this.view === 'today') this.collapse(); else this.view = 'today'; }
  collapse() { this.view = 'compact'; this.alert = null; this.until = 0; }
  get visible() { return this.enabled || this.alert !== null; }
}
module.exports = { overlayBounds, countdownClock, OverlayState };
