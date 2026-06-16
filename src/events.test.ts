import { describe, it, expect } from 'vitest';
import { EVENT_IDS, findEvent, pickEvent, resolveEvent } from './events';
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

describe('resolveEvent', () => {
  it('a flawless completion heals more and grants a buff', () => {
    const p = hurtStats();
    const reward = resolveEvent(p, 'shrine', { completed: true, flawless: true });
    expect(reward.outcome).toBe('blessing');
    expect(reward.healed).toBeGreaterThan(0);
    expect(reward.buffKey).toBe('event_buff_regen');
    expect(p.regen).toBe(2);
    expect(p.hp).toBeGreaterThan(50);
  });

  it('a stumble heals a little and grants no buff', () => {
    const p = hurtStats();
    const reward = resolveEvent(p, 'oath_stone', { completed: true, flawless: false });
    expect(reward.outcome).toBe('faint');
    expect(reward.buffKey).toBeNull();
    expect(p.defense).toBe(0);
    expect(p.hp).toBeGreaterThan(50);
  });

  it('walking away changes nothing', () => {
    const p = hurtStats();
    const reward = resolveEvent(p, 'shrine', { completed: false, flawless: false });
    expect(reward.outcome).toBe('skipped');
    expect(reward.healed).toBe(0);
    expect(p.hp).toBe(50);
    expect(p.regen).toBe(0);
  });

  it('never heals past max HP', () => {
    const p = hurtStats();
    p.hp = 95;
    const reward = resolveEvent(p, 'shrine', { completed: true, flawless: true });
    expect(p.hp).toBe(100);
    expect(reward.healed).toBe(5);
  });

  it('throws on an unknown event id', () => {
    expect(() => resolveEvent(hurtStats(), 'nope', { completed: true, flawless: true })).toThrow();
  });
});
