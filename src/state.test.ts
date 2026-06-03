import { describe, it, expect } from 'vitest';
import { classes, findClass } from './classes';
import { streamFor } from './rng';
import {
  advance,
  applyModifier,
  applyPending,
  classPreview,
  combatStatLines,
  drawBoons,
  isRunComplete,
  newRun,
  upgrades,
  type PlayerStats,
} from './state';

const knight = findClass('knight');

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

function apply(id: string, p: PlayerStats, times = 1): PlayerStats {
  const up = upgrades.find((u) => u.id === id)!;
  for (let i = 0; i < times; i++) up.apply(p);
  return p;
}

describe('classPreview', () => {
  it('applies class stats and starts at full HP', () => {
    const p = classPreview(knight);
    expect(p.maxHP).toBe(125);
    expect(p.hp).toBe(125);
    expect(p.defense).toBe(3);
    expect(p.critMult).toBe(2);
  });
});

describe('newRun', () => {
  it('starts a classic run against the goblin', () => {
    const run = newRun(knight, 'classic', 'seed-1');
    expect(run.mode).toBe('classic');
    expect(run.fightNumber).toBe(1);
    expect(run.defeated).toBe(0);
    expect(run.upcomingEnemy.id).toBe('goblin');
  });

  it('starts an endless run with a generated foe', () => {
    const run = newRun(knight, 'endless', 'seed-1');
    expect(run.mode).toBe('endless');
    expect(run.upcomingEnemy).toBeDefined();
  });
});

describe('isRunComplete', () => {
  it('completes a classic run after the set length', () => {
    const run = newRun(knight, 'classic', 'seed-1');
    run.defeated = 5;
    expect(isRunComplete(run)).toBe(true);
    run.defeated = 4;
    expect(isRunComplete(run)).toBe(false);
  });

  it('never completes an endless run', () => {
    const run = newRun(knight, 'endless', 'seed-1');
    run.defeated = 99;
    expect(isRunComplete(run)).toBe(false);
  });
});

describe('advance', () => {
  it('increments defeated and level', () => {
    const run = newRun(knight, 'classic', 'seed-1');
    advance(run);
    expect(run.defeated).toBe(1);
    expect(run.player.level).toBe(2);
  });
});

describe('modifiers and pending', () => {
  it('queues heal and max-HP boosts', () => {
    const run = newRun(knight, 'classic', 'seed-1');
    applyModifier(run, 'refuge');
    expect(run.pendingHeal).toBe(25);
    applyModifier(run, 'empower');
    expect(run.pendingMaxHPBoost).toBe(15);
    expect(run.pendingHeal).toBe(40);
  });

  it('applies max-HP boost then heals, clamped to max', () => {
    const run = newRun(knight, 'classic', 'seed-1');
    run.player.hp = 100;
    run.pendingMaxHPBoost = 15;
    run.pendingHeal = 1000;
    const applied = applyPending(run);
    expect(run.player.maxHP).toBe(140); // 125 + 15
    expect(run.player.hp).toBe(140);
    expect(applied.maxBoosted).toBe(15);
    expect(run.pendingHeal).toBe(0);
  });
});

describe('combatStatLines', () => {
  it('lists crit damage only when above the base multiplier', () => {
    const base = combatStatLines(freshStats());
    expect(base.find((l) => l.key === 'stat_critdmg')).toBeUndefined();
    const buffed = combatStatLines(apply('execution', freshStats()));
    expect(buffed.find((l) => l.key === 'stat_critdmg')).toBeDefined();
  });
});

describe('upgrade effects', () => {
  it('might raises attack 20%', () => {
    expect(apply('might', freshStats()).atkMult).toBeCloseTo(1.2);
  });
  it('precision adds crit chance and caps at 0.8', () => {
    expect(apply('precision', freshStats()).critChance).toBeCloseTo(0.2);
    expect(apply('precision', freshStats(), 10).critChance).toBe(0.8);
  });
  it('execution raises crit damage and caps at 4', () => {
    expect(apply('execution', freshStats()).critMult).toBeCloseTo(2.5);
    expect(apply('execution', freshStats(), 20).critMult).toBe(4);
  });
  it('bloodthirst caps lifesteal at 0.6', () => {
    expect(apply('bloodthirst', freshStats(), 10).lifesteal).toBe(0.6);
  });
  it('sentinel adds defense and max HP', () => {
    const p = apply('sentinel', freshStats());
    expect(p.defense).toBe(3);
    expect(p.maxHP).toBe(115);
  });
});

describe('drawBoons', () => {
  it('draws the requested number of distinct boons', () => {
    const drawn = drawBoons(3);
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn.map((u) => u.id)).size).toBe(3);
  });

  it('never exceeds the pool and stays distinct', () => {
    const drawn = drawBoons(99);
    expect(drawn).toHaveLength(upgrades.length);
    expect(new Set(drawn.map((u) => u.id)).size).toBe(upgrades.length);
  });

  it('only returns real upgrades when favoring some', () => {
    const ids = new Set(upgrades.map((u) => u.id));
    const drawn = drawBoons(3, ['might', 'frenzy']);
    expect(drawn.every((u) => ids.has(u.id))).toBe(true);
  });

  it('is reproducible from a seeded stream', () => {
    const a = drawBoons(3, [], streamFor('s', 'boons', 1)).map((u) => u.id);
    const b = drawBoons(3, [], streamFor('s', 'boons', 1)).map((u) => u.id);
    expect(a).toEqual(b);
  });
});

describe('class roster', () => {
  it('every favored boon references a real upgrade', () => {
    const ids = new Set(upgrades.map((u) => u.id));
    for (const c of classes) {
      for (const fav of c.favoredBoons) expect(ids.has(fav)).toBe(true);
    }
  });

  it('every class declares a unique passive and its i18n key', () => {
    const passives = classes.map((c) => c.passive);
    expect(new Set(passives).size).toBe(classes.length);
    for (const c of classes) {
      expect(c.passive).toBeTruthy();
      expect(c.passiveKey).toBeTruthy();
    }
  });
});
