import { describe, it, expect } from 'vitest';
import { EVENT_IDS, findEvent, pickEvent, resolveRite } from './events';
import { findCharm } from './charms';
import { streamFor } from './rng';
import type { PlayerStats } from './state';

function hurtStats(): PlayerStats {
  return {
    maxHP: 100,
    hp: 50,
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

describe('pickEvent', () => {
  it('returns a known event with i18n keys', () => {
    const ev = pickEvent(streamFor('e', 1));
    expect(EVENT_IDS).toContain(ev.id);
    expect(ev.titleKey).toBe(`event_${ev.id}_title`);
    expect(ev.litanyKey).toBe(`event_${ev.id}_litany`);
  });

  it('is reproducible from a seeded stream', () => {
    const a = pickEvent(streamFor('s', 'event', 4)).id;
    const b = pickEvent(streamFor('s', 'event', 4)).id;
    expect(a).toBe(b);
  });

  it('findEvent throws on an unknown id', () => {
    expect(() => findEvent('nope')).toThrow();
  });
});

describe('resolveRite', () => {
  it('grants a blessing charm on success', () => {
    const p = hurtStats();
    const result = resolveRite(p, 'shrine', true);
    expect(result.kind).toBe('blessing');
    expect(findCharm(result.charmId).kind).toBe('blessing');
    // Sanctified: +2 regen and a heal.
    expect(p.regen).toBe(2);
    expect(p.hp).toBeGreaterThan(50);
  });

  it('inflicts a scar charm on failure', () => {
    const p = hurtStats();
    const result = resolveRite(p, 'shrine', false);
    expect(result.kind).toBe('scar');
    expect(findCharm(result.charmId).kind).toBe('scar');
    // Forsaken: -12 max HP.
    expect(p.maxHP).toBe(88);
    expect(p.hp).toBeLessThanOrEqual(88);
  });

  it('pairs each event with a distinct blessing and scar', () => {
    for (const id of EVENT_IDS) {
      const bless = resolveRite(hurtStats(), id, true);
      const scar = resolveRite(hurtStats(), id, false);
      expect(bless.kind).toBe('blessing');
      expect(scar.kind).toBe('scar');
      expect(bless.charmId).not.toBe(scar.charmId);
    }
  });

  it('throws on an unknown event id', () => {
    expect(() => resolveRite(hurtStats(), 'nope', true)).toThrow();
  });
});
