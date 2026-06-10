import { describe, it, expect } from 'vitest';
import { bossPhrase, randomWord, rollWordKind, scrambleWord } from './words';
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

describe('bossPhrase', () => {
  it('returns a multi-word sentence for each boss', () => {
    for (const id of ['dragon', 'demon', 'kraken']) {
      const p = bossPhrase(id, streamFor('p', id));
      expect(p.split(' ').length).toBeGreaterThan(3);
    }
  });

  it('is reproducible from a seeded stream', () => {
    const a = bossPhrase('dragon', streamFor('s', 'phrase', 5));
    const b = bossPhrase('dragon', streamFor('s', 'phrase', 5));
    expect(a).toBe(b);
  });

  it('maps depth-scaled ids to the base pool', () => {
    const scaled = bossPhrase('kraken@10', streamFor('s', 'phrase', 1));
    const base = bossPhrase('kraken', streamFor('s', 'phrase', 1));
    expect(scaled).toBe(base);
  });

  it('avoids repeating the previous sentence', () => {
    const r = streamFor('p', 'avoid');
    let prev = bossPhrase('demon', r);
    for (let i = 0; i < 100; i++) {
      const p = bossPhrase('demon', r, prev);
      expect(p).not.toBe(prev);
      prev = p;
    }
  });

  it('falls back to a plain three-word volley for unknown ids', () => {
    const p = bossPhrase('mimic', streamFor('p', 'fallback'));
    expect(p.split(' ')).toHaveLength(3);
  });
});

describe('scrambleWord', () => {
  it('preserves the exact multiset of letters', () => {
    const r = streamFor('scramble', 1);
    for (let i = 0; i < 100; i++) {
      const word = randomWord(4);
      const out = scrambleWord(word, r);
      expect([...out].sort()).toEqual([...word].sort());
    }
  });

  it('differs from the original for a typical word', () => {
    const r = streamFor('scramble', 2);
    for (let i = 0; i < 100; i++) {
      expect(scrambleWord('dragon', r)).not.toBe('dragon');
    }
  });

  it('returns the word unchanged when no other order exists', () => {
    expect(scrambleWord('aaa', streamFor('scramble', 3))).toBe('aaa');
  });

  it('is reproducible from a seeded stream', () => {
    const a = scrambleWord('labyrinth', streamFor('s', 'afflict', 7));
    const b = scrambleWord('labyrinth', streamFor('s', 'afflict', 7));
    expect(a).toBe(b);
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
      Object.keys(counts).every((k) => ['normal', 'flame', 'ward', 'cursed', 'spell'].includes(k)),
    ).toBe(true);
    expect(counts.normal).toBeGreaterThan(2000); // ~68% normal
    expect(counts.flame).toBeGreaterThan(0);
    expect(counts.ward).toBeGreaterThan(0);
    expect(counts.cursed).toBeGreaterThan(0);
  });
});
