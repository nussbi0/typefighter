import { describe, it, expect } from 'vitest';
import { streamFor, dailySeed, randomSeed } from './rng';

describe('streamFor', () => {
  it('is deterministic for the same parts', () => {
    const s1 = streamFor('s', 'boons', 3);
    const s2 = streamFor('s', 'boons', 3);
    const seq1 = Array.from({ length: 10 }, () => s1.next());
    const seq2 = Array.from({ length: 10 }, () => s2.next());
    expect(seq1).toEqual(seq2);
  });

  it('differs for different parts', () => {
    expect(streamFor('s', 'boons', 3).next()).not.toEqual(streamFor('s', 'boons', 4).next());
    expect(streamFor('a').next()).not.toEqual(streamFor('b').next());
  });

  it('produces values in [0, 1)', () => {
    const r = streamFor('range');
    for (let i = 0; i < 200; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('pick and shuffle are reproducible and non-mutating', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(streamFor('k').shuffle(arr)).toEqual(streamFor('k').shuffle(arr));
    expect(streamFor('k').pick(arr)).toBe(streamFor('k').pick(arr));
    const shuffled = streamFor('k').shuffle(arr);
    expect(shuffled).not.toBe(arr);
    expect([...arr]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('weightedIndex stays within range', () => {
    const r = streamFor('w');
    for (let i = 0; i < 50; i++) {
      const idx = r.weightedIndex([1, 3, 1]);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(3);
    }
  });
});

describe('dailySeed', () => {
  it('is the UTC calendar date', () => {
    expect(dailySeed(new Date(Date.UTC(2026, 5, 3)))).toBe('2026-06-03');
    expect(dailySeed(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31');
  });
});

describe('randomSeed', () => {
  it('returns a non-empty string', () => {
    expect(randomSeed().length).toBeGreaterThan(0);
  });
});
