import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordSeedResult,
  getSeedResult,
  recentDailies,
  resetStatsCache,
  type SeedResult,
} from './stats';

function result(over: Partial<SeedResult> = {}): SeedResult {
  return {
    depth: 5,
    bestWPM: 60,
    avgWPM: 50,
    accuracy: 0.95,
    durationMs: 120000,
    classId: 'knight',
    ...over,
  };
}

describe('recordSeedResult', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStatsCache();
  });

  it('stores the first result and reports it as a record', () => {
    expect(recordSeedResult('s', result({ depth: 4 }))).toBe(true);
    expect(getSeedResult('s')?.depth).toBe(4);
  });

  it('keeps a deeper run and reports a new record', () => {
    recordSeedResult('s', result({ depth: 4 }));
    expect(recordSeedResult('s', result({ depth: 7 }))).toBe(true);
    expect(getSeedResult('s')?.depth).toBe(7);
  });

  it('rejects a shallower run', () => {
    recordSeedResult('s', result({ depth: 7 }));
    expect(recordSeedResult('s', result({ depth: 3 }))).toBe(false);
    expect(getSeedResult('s')?.depth).toBe(7);
  });

  it('breaks ties on best WPM', () => {
    recordSeedResult('s', result({ depth: 5, bestWPM: 50 }));
    expect(recordSeedResult('s', result({ depth: 5, bestWPM: 70 }))).toBe(true);
    expect(getSeedResult('s')?.bestWPM).toBe(70);
  });
});

describe('recentDailies', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStatsCache();
  });

  it('lists only date-shaped seeds, newest first', () => {
    recordSeedResult('2026-06-01', result({ depth: 3 }));
    recordSeedResult('2026-06-03', result({ depth: 8 }));
    recordSeedResult('custom-abc', result({ depth: 5 }));
    const dailies = recentDailies();
    expect(dailies.map((d) => d.date)).toEqual(['2026-06-03', '2026-06-01']);
  });

  it('respects the limit', () => {
    for (let d = 1; d <= 6; d++) {
      recordSeedResult(`2026-06-0${d}`, result());
    }
    expect(recentDailies(3)).toHaveLength(3);
  });
});
