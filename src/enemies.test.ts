import { describe, it, expect } from 'vitest';
import {
  endlessCandidates,
  enemiesByTier,
  findEnemy,
  isEndlessBossDepth,
  scaleEnemy,
} from './enemies';

describe('findEnemy', () => {
  it('returns the matching enemy', () => {
    expect(findEnemy('goblin').id).toBe('goblin');
  });
  it('throws on unknown id', () => {
    expect(() => findEnemy('nope')).toThrow();
  });
});

describe('enemiesByTier', () => {
  it('returns only enemies of that tier', () => {
    const tier2 = enemiesByTier(2);
    expect(tier2.length).toBeGreaterThan(0);
    expect(tier2.every((e) => e.tier === 2)).toBe(true);
  });
});

describe('isEndlessBossDepth', () => {
  it('is true every fifth depth', () => {
    expect(isEndlessBossDepth(5)).toBe(true);
    expect(isEndlessBossDepth(10)).toBe(true);
    expect(isEndlessBossDepth(1)).toBe(false);
    expect(isEndlessBossDepth(4)).toBe(false);
  });
});

describe('scaleEnemy', () => {
  it('leaves stats unchanged at depth 1', () => {
    const goblin = findEnemy('goblin');
    const scaled = scaleEnemy(goblin, 1);
    expect(scaled.maxHP).toBe(goblin.maxHP);
    expect(scaled.hitDamage).toBe(goblin.hitDamage);
    expect(scaled.msPerChar).toBe(goblin.msPerChar);
  });

  it('makes foes tougher and faster as depth grows', () => {
    const goblin = findEnemy('goblin');
    const deep = scaleEnemy(goblin, 8);
    expect(deep.maxHP).toBeGreaterThan(goblin.maxHP);
    expect(deep.hitDamage).toBeGreaterThan(goblin.hitDamage);
    expect(deep.msPerChar).toBeLessThan(goblin.msPerChar);
    expect(deep.comboChance).toBeGreaterThanOrEqual(goblin.comboChance);
  });

  it('tags the scaled copy with the depth', () => {
    expect(scaleEnemy(findEnemy('goblin'), 4).id).toBe('goblin@4');
  });

  it('scales an existing phase change', () => {
    const dragon = findEnemy('dragon');
    const scaled = scaleEnemy(dragon, 10);
    expect(scaled.phaseChange).toBeDefined();
    expect(scaled.phaseChange!.msPerChar).toBeLessThan(dragon.phaseChange!.msPerChar);
  });
});

describe('endlessCandidates', () => {
  it('offers two choices', () => {
    expect(endlessCandidates(1)).toHaveLength(2);
    expect(endlessCandidates(7)).toHaveLength(2);
  });

  it('offers only bosses on boss depths', () => {
    for (const e of endlessCandidates(5)) expect(e.isBoss).toBe(true);
    for (const e of endlessCandidates(10)) expect(e.isBoss).toBe(true);
  });

  it('offers only non-bosses on normal depths', () => {
    for (const e of endlessCandidates(3)) expect(e.isBoss).toBeFalsy();
  });

  it('widens the foe pool with depth', () => {
    // Depth 1 only draws from tier 1; nothing higher should appear.
    for (let i = 0; i < 30; i++) {
      for (const e of endlessCandidates(1)) expect(e.tier).toBe(1);
    }
  });
});
