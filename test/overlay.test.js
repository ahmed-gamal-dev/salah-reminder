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
