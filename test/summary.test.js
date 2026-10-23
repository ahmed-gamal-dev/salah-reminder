import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { buildSummary } = require('../src/core/summary');
const { sanitize } = require('../src/core/settings');
const { timesForDay } = require('../src/core/prayer');

const s = sanitize({ language: 'en', hour12: false });
const t = timesForDay(s.location, { year: 2026, month: 3, day: 10 }, s);

describe('buildSummary', () => {
  it('shows the next prayer with countdown', () => {
    const now = new Date(t.dhuhr.getTime() + 60000);
    const sum = buildSummary(now, s);
    expect(sum.next.name).toBe('asr');
    expect(sum.trayTitle).toMatch(/^Asr \d/);
    expect(sum.rows).toHaveLength(6);
    expect(sum.rows.filter((r) => r.isNext).map((r) => r.key)).toEqual(['asr']);
  });
  it('no row is highlighted once Isha has passed (next is tomorrow)', () => {
    const sum = buildSummary(new Date(t.isha.getTime() + 60000), s);
    expect(sum.next.name).toBe('fajr');
    expect(sum.rows.some((r) => r.isNext)).toBe(false);
  });
  it('hides the title when countdown is disabled but keeps the tooltip', () => {
    const sum = buildSummary(new Date(t.dhuhr.getTime() + 60000), sanitize({ ...s, tray: { showCountdown: false } }));
    expect(sum.trayTitle).toBe('');
    expect(sum.tooltip).toContain('Asr');
  });
  it('uses Arabic labels and Jumu\'ah on Fridays', () => {
    const fri = timesForDay(s.location, { year: 2026, month: 3, day: 13 }, s);
    const sum = buildSummary(new Date(fri.fajr.getTime() + 60000), sanitize({ language: 'ar' }));
    expect(sum.rows.find((r) => r.key === 'dhuhr').label).toBe('الجمعة');
    expect(sum.rows.find((r) => r.key === 'fajr').label).toBe('الفجر');
  });
});
