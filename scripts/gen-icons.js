'use strict';
// Generates assets/icon.png (512px app icon) and tray template icons with no image dependencies.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel, height = size) {
  const raw = Buffer.alloc((size * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Crescent = big disc minus an offset disc, anti-aliased by 4x4 supersampling.
function crescentCoverage(x, y, size) {
  let hit = 0;
  const S = 4;
  for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
    const u = (x + (sx + 0.5) / S) / size, v = (y + (sy + 0.5) / S) / size;
    const inBig = (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.30 ** 2;
    const inCut = (u - 0.62) ** 2 + (v - 0.42) ** 2 <= 0.25 ** 2;
    if (inBig && !inCut) hit++;
  }
  return hit / (S * S);
}

const out = path.join(__dirname, '..', 'assets');
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(path.join(out, 'icon.png'), png(512, (x, y, s) => {
  const u = x / s, v = y / s;
  const inside = ((u - 0.5) ** 2 + (v - 0.5) ** 2) <= 0.48 ** 2; // round badge
  if (!inside) return [0, 0, 0, 0];
  const c = crescentCoverage(x, y, s);
  const bg = [0x0f, 0x4c, 0x3a], fg = [0xf5, 0xe6, 0xb3];
  return [0, 1, 2].map((i) => Math.round(bg[i] * (1 - c) + fg[i] * c)).concat(255);
}));

// macOS template image: black + alpha only. @2x for retina.
for (const [name, size] of [['trayTemplate.png', 18], ['trayTemplate@2x.png', 36]]) {
  fs.writeFileSync(path.join(out, name), png(size, (x, y, s) => [0, 0, 0, Math.round(255 * crescentCoverage(x, y, s))]));
}
// Windows/Linux tray: light crescent that reads on dark and light panels via a soft outline-free green badge.
fs.writeFileSync(path.join(out, 'tray.png'), png(32, (x, y, s) => {
  const u = x / s, v = y / s;
  if (((u - 0.5) ** 2 + (v - 0.5) ** 2) > 0.48 ** 2) return [0, 0, 0, 0];
  const c = crescentCoverage(x, y, s);
  const bg = [0x0f, 0x4c, 0x3a], fg = [0xf5, 0xe6, 0xb3];
  return [0, 1, 2].map((i) => Math.round(bg[i] * (1 - c) + fg[i] * c)).concat(255);
}));
console.log('icons written to', out);

// AppX requires explicit artwork; avoid the builder's sample Store/tile logos.
const appx = path.join(__dirname, '..', 'build', 'appx');
fs.mkdirSync(appx, { recursive: true });
function storePixel(x, y, size) {
  const c = crescentCoverage(x, y, size);
  const bg = [0x0f, 0x4c, 0x3a], fg = [0xf5, 0xe6, 0xb3];
  return [0, 1, 2].map(i => Math.round(bg[i] * (1 - c) + fg[i] * c)).concat(255);
}
for (const [name, size] of [['StoreLogo', 50], ['Square150x150Logo', 150], ['Square44x44Logo', 44]]) {
  fs.writeFileSync(path.join(appx, name + '.png'), png(size, storePixel));
}
fs.writeFileSync(path.join(appx, 'Wide310x150Logo.png'), png(310, (x, y) => storePixel(x - 80, y, 150), 150));
