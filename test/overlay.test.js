import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { overlayBounds } = require('../src/core/overlay');
const { sanitize } = require('../src/core/settings');

describe('top banner', () => {
  it('stays below the camera/menu bar and within an external display with negative coordinates', () => {
    for (const display of [
      { bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 34 } },
      { bounds: { x: -1920, y: -1080, width: 1920, height: 1080 }, workArea: { y: -1055 } },
      { bounds: { x: 0, y: 0, width: 320, height: 600 }, workArea: { y: 25 } },
    ]) {
      const rect = overlayBounds(display);
      expect(rect.y).toBeGreaterThanOrEqual(display.workArea.y);
      expect(rect.y).toBeGreaterThanOrEqual(display.bounds.y + 38);
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
  it('allows collapse without stopping sound and retains the playback state', () => {
    const s = new OverlayState(); s.configure(true);
    s.notify({ sound: true }, 0); s.playback(true); s.collapse(); s.tick(20000);
    expect(s.view).toBe('compact'); expect(s.playing).toBe(true);
    s.toggleToday(); s.playback(false); expect(s.view).toBe('today');
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
  it('uses only the small window for compact mode and expands for details', () => {
    const d = { bounds: { x: 0, y: 0, width: 1710, height: 1107 }, workArea: { y: 34 } };
    const compact = overlayBounds(d, 'compact');
    const today = overlayBounds(d, 'today'); const alert = overlayBounds(d, 'alert');
    expect(compact.height).toBe(54); expect(today.height).toBeGreaterThan(compact.height);
    expect(alert.height).toBeGreaterThan(compact.height);
    for (const b of [compact, today, alert]) expect(b.x + b.width / 2).toBe(855);
  });
});
