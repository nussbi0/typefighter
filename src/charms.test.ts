import { describe, it, expect } from 'vitest';
import { applyCharm, charms, findCharm } from './charms';
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

describe('charms', () => {
  it('has a balanced set of blessings and scars', () => {
    const blessings = charms.filter((c) => c.kind === 'blessing');
    const scars = charms.filter((c) => c.kind === 'scar');
    expect(blessings.length).toBeGreaterThanOrEqual(4);
    expect(scars.length).toBe(blessings.length);
  });

  it('every charm has a known kind', () => {
    for (const c of charms) expect(['blessing', 'scar']).toContain(c.kind);
  });

  it('findCharm throws on an unknown id', () => {
    expect(() => findCharm('nope')).toThrow();
  });

  it('a blessing improves a stat', () => {
    const p = freshStats();
    applyCharm(p, findCharm('resolute'));
    expect(p.defense).toBe(3);
  });

  it('a scar worsens a stat', () => {
    const p = freshStats();
    applyCharm(p, findCharm('forsaken'));
    expect(p.maxHP).toBe(88);
    expect(p.hp).toBe(88); // clamped to the new max
  });

  it('clamps so scars never drop a stat below its floor', () => {
    const p = freshStats();
    p.atkMult = 0.55;
    applyCharm(p, findCharm('withered')); // -0.12 atk, floor 0.5
    expect(p.atkMult).toBe(0.5);
  });
});
