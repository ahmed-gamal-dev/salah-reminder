import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { overlayBounds } = require('../src/core/overlay');
const { sanitize } = require('../src/core/settings');

describe('top banner', () => {
  it('anchors the animation window to the top edge, including displays with negative coordinates', () => {
    for (const display of [
      { bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 34 } },
      { bounds: { x: -1920, y: -1080, width: 1920, height: 1080 }, workArea: { y: -1055 } },
      { bounds: { x: 0, y: 0, width: 320, height: 600 }, workArea: { y: 25 } },
    ]) {
      const rect = overlayBounds(display);
      expect(rect.y).toBe(display.bounds.y);
      expect(rect.x).toBeGreaterThanOrEqual(display.bounds.x);
      expect(rect.x + rect.width).toBeLessThanOrEqual(display.bounds.x + display.bounds.width);
    }
  });
  it('is opt-in and survives validation/reload', () => {
    expect(sanitize({}).notifications.topBanner).toBe(false);
    expect(sanitize({ notifications: { topBanner: 'yes' } }).notifications.topBanner).toBe(false);
    const s = sanitize({ notifications: { topBanner: true } });
    expect(sanitize(s).notifications.topBanner).toBe(true);
  });
});

const { countdownClock, OverlayState } = require('../src/core/overlay');

describe('persistent notch clock', () => {
  it('counts down in seconds and clamps past times to zero', () => {
    expect(countdownClock(3661000)).toBe('01:01:01');
    expect(countdownClock(1)).toBe('00:00:01');
    expect(countdownClock(-2000)).toBe('00:00:00');
  });
  it('stays visible indefinitely when enabled, and toggles the day list', () => {
    const s = new OverlayState(); s.configure(true);
    s.tick(24 * 3600000);
    expect(s.visible).toBe(true); expect(s.view).toBe('compact');
    s.toggleToday(); expect(s.view).toBe('today');
    s.toggleToday(); expect(s.view).toBe('compact'); expect(s.visible).toBe(true);
    s.configure(false); expect(s.visible).toBe(false);
  });
  it('holds the adhan alert beyond 15 seconds while playing and collapses on completion', () => {
    const s = new OverlayState(); s.configure(true);
    s.notify({ sound: true }, 0); s.playback(true); s.tick(20000);
    expect(s.view).toBe('alert');
    s.playback(false); expect(s.view).toBe('compact'); expect(s.visible).toBe(true);
  });
  it('returns a silent reminder to the compact clock after 15 seconds', () => {
    const s = new OverlayState(); s.configure(true);
    s.notify({ sound: false }, 1000); s.tick(15999); expect(s.view).toBe('alert');
    s.tick(16000); expect(s.view).toBe('compact'); expect(s.visible).toBe(true);
  });
  it('prevents collapse and day toggles until adhan playback ends', () => {
    const s = new OverlayState(); s.configure(true);
    s.notify({ sound: true }, 0); s.playback(true); s.collapse(); s.tick(20000);
    expect(s.view).toBe('alert'); expect(s.playing).toBe(true);
    s.toggleToday(); expect(s.view).toBe('alert');
    s.playback(false); expect(s.view).toBe('compact');
  });
  it('supports temporary preview while disabled without turning on persistence', () => {
    const s = new OverlayState(); s.notify({ sound: false }, 0);
    expect(s.visible).toBe(true); s.toggleToday(); expect(s.visible).toBe(true);
    s.collapse(); expect(s.visible).toBe(false);
    s.notify({ sound: false }, 0); s.tick(15000); expect(s.visible).toBe(false);
  });
  it('disabling the feature clears any active panel', () => {
    const s = new OverlayState(); s.configure(true); s.notify({ sound: true }, 0); s.playback(true);
    s.configure(false); expect(s.visible).toBe(false); expect(s.view).toBe('compact');
  });
  it('keeps the native window fixed while the visible surface expands', () => {
    const { islandLayout } = require('../src/core/island-geometry');
    const d = { bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 34 } };
    const metrics = { width: 185, height: 33.5 };
    const compact = islandLayout(d, metrics, 'compact');
    const today = islandLayout(d, metrics, 'today');
    expect(compact.window).toEqual(today.window);
    expect(compact.window.y).toBe(0);
    expect(compact.gap).toBe(197);
    expect(compact.header).toBe(38);
    expect(today.height).toBeGreaterThan(compact.height);
    expect(today.width).toBeGreaterThan(compact.width);
    expect(compact.window.x + compact.window.width / 2).toBe(855);
  });
});

const { islandLayout, hitTest } = require('../src/core/island-geometry');
describe('camera-safe island geometry and click-through', () => {
  it('reserves the native camera width even when the menu bar is auto-hidden', () => {
    const d = { bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 0 } };
    const l = islandLayout(d, { width: 185, height: 33.5 });
    expect(l.gap).toBeGreaterThan(185);
    expect(l.header).toBeGreaterThan(33.5);
    expect(l.width).toBe(185); expect(l.height).toBe(57.5);
  });
  it('has no empty camera gap on a display known to have no notch', () => {
    const d = { bounds: { x: -1920, y: -1080, width: 1920, height: 1080 }, workArea: { y: -1050 } };
    const l = islandLayout(d, { width: 0, height: 0 });
    expect(l.gap).toBe(0); expect(l.window.y).toBe(-1080);
  });
  it('passes transparent space and the physical camera through, while keeping both wings clickable', () => {
    const rect = { left: 100, top: 0, width: 413, height: 38 };
    expect(hitTest(5, 5, rect, 18, 197, 38)).toBe(false);
    expect(hitTest(120, 15, rect, 18, 197, 38)).toBe(true);
    expect(hitTest(490, 15, rect, 18, 197, 38)).toBe(true);
    expect(hitTest(306, 15, rect, 18, 197, 38)).toBe(false);
    expect(hitTest(100, 38, rect, 18, 197, 38)).toBe(false);
    expect(hitTest(306, 39, rect, 18, 197, 38)).toBe(false);
  });
  it('releases collapsed areas and preserves controls in the expanded panel', () => {
    const small = { left: 100, top: 0, width: 413, height: 38 };
    const big = { left: 56, top: 0, width: 500, height: 380 };
    expect(hitTest(200, 200, small, 18, 197, 38)).toBe(false);
    expect(hitTest(200, 200, big, 30, 197, 38)).toBe(true);
  });
});

describe('notch hover', () => {
  it('opens on entry, tolerates movement into the panel, then folds after leave grace', () => {
    const s = new OverlayState(); s.configure(true);
    s.hover(true, 0); expect(s.view).toBe('today');
    s.hover(false, 80); s.hover(false, 300); expect(s.view).toBe('today');
    s.hover(true, 320); s.hover(false, 400); s.hover(false, 700);
    expect(s.view).toBe('compact');
  });
  it('keeps adhan and stop available through mouse leave and dismiss', () => {
    const s = new OverlayState(); s.configure(true); s.hover(true, 0);
    s.notify({ sound: true }, 0); s.playback(true);
    s.hover(false, 80); s.hover(false, 1000); s.toggleToday(); s.collapse(); s.tick(60000);
    expect(s.view).toBe('alert');
    s.playback(false); expect(s.view).toBe('compact');
  });
  it('returns to today on audio completion if the pointer is still over the panel', () => {
    const s = new OverlayState(); s.configure(true); s.hover(true, 0);
    s.notify({ sound: true }, 0); s.playback(true); s.playback(false);
    expect(s.view).toBe('today');
    s.hover(false, 10); s.hover(false, 310); expect(s.view).toBe('compact');
  });
});

describe('native cursor hover routing', () => {
  it('detects the physical camera, retains the expanded panel and folds on exit', () => {
    const fs = require('node:fs'); const vm = require('node:vm');
    const mainRequire = createRequire(new URL('../src/main/overlay.js', import.meta.url));
    let cursor = { x: 855, y: 10 };
    const display = { id: 1, internal: true, bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 34 } };
    const context = { module: { exports: {} }, __dirname: '/app/src/main',
      setInterval: () => ({ unref() {} }), Date,
      require(name) { return name === 'electron' ? { screen: { getAllDisplays: () => [display], getCursorScreenPoint: () => cursor } } : mainRequire(name); } };
    vm.runInNewContext(fs.readFileSync(new URL('../src/main/overlay.js', import.meta.url), 'utf8'), context);
    const overlay = new context.module.exports.PrayerOverlay();
    overlay.metricsReady = true; overlay.metrics.set(1, { width: 185, height: 33.5 });
    overlay.win = { isDestroyed: () => false, isVisible: () => true };
    overlay.present = () => {}; overlay.state.configure(true);
    overlay.trackHover(); expect(overlay.state.view).toBe('today');
    cursor = { x: 700, y: 250 }; overlay.trackHover(); expect(overlay.state.hovered).toBe(true);
    cursor = { x: 200, y: 500 }; overlay.trackHover(); expect(overlay.state.hovered).toBe(false);
    overlay.state.leaveAt = 0; overlay.trackHover(); expect(overlay.state.view).toBe('compact');
  });
});
