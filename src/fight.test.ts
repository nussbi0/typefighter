import { describe, it, expect } from 'vitest';
import { accuracyCap, lowerTier } from './fight';

describe('accuracyCap', () => {
  it('allows Perfect only at very high accuracy', () => {
    expect(accuracyCap(1)).toBe('perfect');
    expect(accuracyCap(0.95)).toBe('perfect');
    expect(accuracyCap(0.94)).toBe('great');
  });

  it('steps down through the thresholds', () => {
    expect(accuracyCap(0.8)).toBe('great');
    expect(accuracyCap(0.79)).toBe('good');
    expect(accuracyCap(0.55)).toBe('good');
    expect(accuracyCap(0.54)).toBe('sloppy');
  });

  it('caps a key-masher at Sloppy', () => {
    // ~5 needed keys among ~120 random presses
    expect(accuracyCap(5 / 125)).toBe('sloppy');
  });

  it("doesn't punish a stray typo in a long phrase", () => {
    // 2 typos across a 40-char boss phrase stays Perfect-eligible
    expect(accuracyCap(40 / 42)).toBe('perfect');
  });

  it('dings a short word with one typo down to Great', () => {
    // "storm" with one wrong key: 5 correct / 6 total ≈ 0.83
    expect(accuracyCap(5 / 6)).toBe('great');
  });
});

describe('lowerTier', () => {
  it('returns the weaker of two tiers', () => {
    expect(lowerTier('perfect', 'good')).toBe('good');
    expect(lowerTier('great', 'perfect')).toBe('great');
    expect(lowerTier('sloppy', 'great')).toBe('sloppy');
    expect(lowerTier('good', 'good')).toBe('good');
  });

  it('models the cap: a fast but sloppy strike lands Sloppy', () => {
    // speed says Perfect, accuracy says Sloppy → Sloppy wins
    expect(lowerTier('perfect', accuracyCap(0.1))).toBe('sloppy');
  });
});
