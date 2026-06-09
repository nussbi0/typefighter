import { describe, it, expect } from 'vitest';
import { randomWord, rollWordKind } from './words';
import { getLocale } from './i18n';
import { streamFor } from './rng';

describe('randomWord', () => {
  it('defaults to english', () => {
    expect(getLocale()).toBe('en');
  });

  it('draws only short words at level 1', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomWord(1).length).toBeLessThanOrEqual(4);
    }
  });

  it('draws longer words at high levels', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomWord(5).length).toBeGreaterThanOrEqual(6);
    }
  });

  it('clamps levels beyond the last band', () => {
    expect(typeof randomWord(99)).toBe('string');
    expect(randomWord(99).length).toBeGreaterThan(0);
  });

  it('defaults the level when called without one', () => {
    expect(randomWord().length).toBeLessThanOrEqual(4);
  });

  it('never repeats the avoided (previous) word', () => {
    let prev = randomWord(3);
    for (let i = 0; i < 300; i++) {
      const w = randomWord(3, undefined, prev);
      expect(w).not.toBe(prev);
      prev = w;
    }
  });

  it('avoids every word in a given set (whole-combo dedup)', () => {
    for (let i = 0; i < 300; i++) {
      const a = randomWord(3);
      const b = randomWord(3, undefined, [a]);
      const c = randomWord(3, undefined, [a, b]);
      expect(new Set([a, b, c]).size).toBe(3);
    }
  });
});

describe('rollWordKind', () => {
  it('is reproducible from a seeded stream', () => {
    const r1 = streamFor('k', 'words', 1);
    const r2 = streamFor('k', 'words', 1);
    const s1 = Array.from({ length: 50 }, () => rollWordKind(r1));
    const s2 = Array.from({ length: 50 }, () => rollWordKind(r2));
    expect(s1).toEqual(s2);
  });

  it('returns only valid kinds and is mostly normal', () => {
    const r = streamFor('distribution');
    const counts: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) {
      const k = rollWordKind(r);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(
      Object.keys(counts).every((k) => ['normal', 'flame', 'ward', 'cursed'].includes(k)),
    ).toBe(true);
    expect(counts.normal).toBeGreaterThan(2000); // ~74% normal
    expect(counts.flame).toBeGreaterThan(0);
    expect(counts.ward).toBeGreaterThan(0);
    expect(counts.cursed).toBeGreaterThan(0);
  });
});
