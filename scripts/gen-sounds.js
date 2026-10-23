'use strict';
// Generates assets/sounds/chime.wav: a soft two-note bell, no dependencies.
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const notes = [{ f: 659.25, t: 0, d: 1.6 }, { f: 880, t: 0.45, d: 2.0 }];
const total = 2.6;
const samples = new Int16Array(Math.floor(RATE * total));
for (const n of notes) {
  for (let i = 0; i < RATE * n.d; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.4);
    const v = (Math.sin(2 * Math.PI * n.f * t) + 0.3 * Math.sin(2 * Math.PI * n.f * 2 * t)) * env * 0.35;
    const idx = Math.floor(RATE * n.t) + i;
    if (idx < samples.length) samples[idx] = Math.max(-32768, Math.min(32767, samples[idx] + Math.round(v * 32767)));
  }
}
const data = Buffer.from(samples.buffer);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'sounds', 'chime.wav'), Buffer.concat([h, data]));
console.log('chime.wav written');
