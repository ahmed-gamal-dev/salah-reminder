(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalahIslandGeometry = api;
})(globalThis, function () {
  'use strict';
  function islandLayout(display, metrics, mode = 'compact') {
    const b = display.bounds;
    const top = display.workArea.y - b.y;
    const notch = metrics || (top >= 30 ? { width: 260, height: top } : { width: 0, height: 0 });
    const gap = notch.width > 0 ? Math.ceil(notch.width + 12) : 0;
    const header = Math.ceil(Math.max(34, notch.height + 4));
    const windowWidth = Math.min(b.width, Math.max(620, gap + 240));
    const windowHeight = Math.min(b.height, header + 390);
    const compactWidth = Math.min(windowWidth - 16, Math.max(280, gap + 216));
    const sizes = {
      compact: [compactWidth, header],
      today: [Math.min(windowWidth - 16, Math.max(500, compactWidth + 60)), Math.min(windowHeight - 12, header + 342)],
      alert: [Math.min(windowWidth - 16, Math.max(480, compactWidth + 40)), Math.min(windowHeight - 12, header + 144)],
    };
    const [width, height] = sizes[mode] || sizes.compact;
    return {
      window: { x: Math.round(b.x + (b.width - windowWidth) / 2), y: b.y, width: windowWidth, height: windowHeight },
      width, height, gap, header, radius: mode === 'compact' ? 18 : 30,
    };
  }
  // Only the visible black surface receives clicks, including its animated intermediate geometry.
  function hitTest(x, y, rect, radius, gap = 0, header = 0) {
    const px = x - rect.left, py = y - rect.top;
    if (px < 0 || py < 0 || px > rect.width || py > rect.height) return false;
    if (gap && py < header - 4 && Math.abs(px - rect.width / 2) < gap / 2) return false;
    const r = Math.min(radius, rect.width / 2, rect.height / 2);
    if (py > rect.height - r) {
      if (px < r) return (px - r) ** 2 + (py - (rect.height - r)) ** 2 <= r ** 2;
      if (px > rect.width - r) return (px - (rect.width - r)) ** 2 + (py - (rect.height - r)) ** 2 <= r ** 2;
    }
    return true;
  }
  return { islandLayout, hitTest };
});
