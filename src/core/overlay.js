'use strict';

/** Position below the menu bar / camera cutout; never draw inside the physical notch. */
function overlayBounds(display) {
  const { bounds, workArea } = display;
  const width = Math.min(420, bounds.width - 24);
  return {
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.max(bounds.y + 38, workArea.y + 4),
    width,
    height: 150,
  };
}
module.exports = { overlayBounds };
