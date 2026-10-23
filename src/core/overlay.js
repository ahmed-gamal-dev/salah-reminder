'use strict';

function countdownClock(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((n) => String(n).padStart(2, '0')).join(':');
}

/** Position below the camera/menu bar, with a small hit area when collapsed. */
function overlayBounds(display, mode = 'compact') {
  const { bounds, workArea } = display;
  const sizes = { compact: [300, 54], today: [390, 380], alert: [420, 196] };
  const [wantedWidth, wantedHeight] = sizes[mode] || sizes.compact;
  const width = Math.min(wantedWidth, bounds.width - 24);
  const y = Math.max(bounds.y + 38, workArea.y + 4);
  return {
    x: Math.round(bounds.x + (bounds.width - width) / 2), y, width,
    height: Math.min(wantedHeight, bounds.y + bounds.height - y - 12),
  };
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
