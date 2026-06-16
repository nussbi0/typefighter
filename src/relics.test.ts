import { describe, it, expect } from 'vitest';
import {
  applyRelic,
  BASE_RELIC_EFFECTS,
  drawRelics,
  findRelic,
  relicEffects,
  relics,
} from './relics';
import { streamFor } from './rng';
import type { PlayerStats } from './state';

function freshStats(): PlayerStats {
  return {
    maxHP: 100,
    hp: 100,
    atkMult: 1,
    level: 1,
    defense: 0,
    critChance: 0,
    critMult: 2,
    lifesteal: 0,
    comboBonus: 0,
    timeFactor: 1,
    regen: 0,
  };
}

describe('relicEffects', () => {
  it('returns base effects for no relics', () => {
    expect(relicEffects([])).toEqual(BASE_RELIC_EFFECTS);
    expect(relicEffects()).toEqual(BASE_RELIC_EFFECTS);
  });

  it('folds a single relic over the base', () => {
    const e = relicEffects(['metronome']);
    expect(e.critEveryN).toBe(13);
    expect(e.damageDealtMult).toBe(1);
  });

  it('multiplies damage multipliers across relics and ignores unknown ids', () => {
    const e = relicEffects(['glass_cannon', 'nonsense']);
    expect(e.damageDealtMult).toBeCloseTo(1.5);
    expect(e.damageTakenMult).toBeCloseTo(1.3);
  });

  it('takes the smallest crit cadence when several apply', () => {
    // Only metronome carries critEveryN, but the fold must keep a nonzero min.
    expect(relicEffects(['metronome', 'warbanner']).critEveryN).toBe(13);
  });

  it('sums overdrive bonus and sets cheat death', () => {
    expect(relicEffects(['warbanner']).overdriveBonusMs).toBe(3000);
    expect(relicEffects(['phoenix_feather']).cheatDeath).toBe(true);
    expect(relicEffects(['arcane_focus']).manaOnPerfect).toBe(1);
  });
});

describe('applyRelic', () => {
  it('applies an immediate stat warp (Sanguine Pact)', () => {
    const p = freshStats();
    applyRelic(p, findRelic('sanguine_pact'));
    expect(p.lifesteal).toBeCloseTo(0.4);
    expect(p.maxHP).toBe(50);
    expect(p.hp).toBe(50);
  });

  it('is a no-op for a purely runtime relic', () => {
    const p = freshStats();
    applyRelic(p, findRelic('metronome'));
    expect(p).toEqual(freshStats());
  });

  it('findRelic throws on an unknown id', () => {
    expect(() => findRelic('nope')).toThrow();
  });
});

describe('drawRelics', () => {
  it('excludes already-held relics', () => {
    const held = relics.slice(0, 2).map((r) => r.id);
    const drawn = drawRelics(held, 3, streamFor('r', 1));
    expect(drawn.every((r) => !held.includes(r.id))).toBe(true);
  });

  it('is reproducible from a seeded stream', () => {
    const a = drawRelics([], 3, streamFor('s', 'relic', 2)).map((r) => r.id);
    const b = drawRelics([], 3, streamFor('s', 'relic', 2)).map((r) => r.id);
    expect(a).toEqual(b);
  });

  it('returns an empty draw when everything is held', () => {
    const all = relics.map((r) => r.id);
    expect(drawRelics(all, 3, streamFor('r', 9))).toHaveLength(0);
  });
});
