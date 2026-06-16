import { describe, it, expect } from 'vitest';
import {
  deedLine,
  DEEDS,
  eliteModifierLine,
  ELITE_MODIFIERS,
  endlessCandidates,
  enemiesByTier,
  enemyAbilities,
  findEnemy,
  isEndlessBossDepth,
  makeElite,
  scaleEnemy,
} from './enemies';
import { streamFor } from './rng';

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

  it('scales ability values with depth', () => {
    const golem = findEnemy('golem'); // has armor
    const scaled = scaleEnemy(golem, 9);
    expect(scaled.armor!).toBeGreaterThan(golem.armor!);
  });

  it('leaves foes without an ability ability-free', () => {
    expect(scaleEnemy(findEnemy('goblin'), 5).armor).toBeUndefined();
  });
});

describe('enemyAbilities', () => {
  it('lists armor and a value for the golem', () => {
    const lines = enemyAbilities(findEnemy('golem'));
    const armor = lines.find((l) => l.key === 'ability_armor');
    expect(armor).toBeDefined();
    expect(armor!.value).toBe(6);
  });

  it('lists lifesteal for the vampire and nothing for the goblin', () => {
    expect(enemyAbilities(findEnemy('vampire')).some((l) => l.key === 'ability_lifesteal')).toBe(
      true,
    );
    expect(enemyAbilities(findEnemy('goblin'))).toHaveLength(0);
  });

  it('lists each affliction as a tag', () => {
    expect(enemyAbilities(findEnemy('sorcerer')).some((l) => l.key === 'ability_scramble')).toBe(
      true,
    );
    expect(enemyAbilities(findEnemy('ghost')).some((l) => l.key === 'ability_fog')).toBe(true);
    expect(enemyAbilities(findEnemy('vampire')).some((l) => l.key === 'ability_mirror')).toBe(true);
  });
});

describe('afflictions', () => {
  it('survive depth scaling unchanged', () => {
    expect(scaleEnemy(findEnemy('sorcerer'), 9).afflict).toBe('scramble');
    expect(scaleEnemy(findEnemy('goblin'), 9).afflict).toBeUndefined();
  });
});

describe('makeElite', () => {
  it('names the elite, picks a known modifier and deed, and toughens it', () => {
    const base = findEnemy('orc');
    const elite = makeElite(base, streamFor('e', 1));
    expect(elite.elite).toBe(true);
    expect(elite.eliteName).toMatch(/ the /);
    expect(ELITE_MODIFIERS).toContain(elite.eliteModifier);
    expect(DEEDS).toContain(elite.deed);
    expect(elite.maxHP).toBeGreaterThan(base.maxHP);
  });

  it('is reproducible from a seeded stream', () => {
    const a = makeElite(findEnemy('orc'), streamFor('s', 'elite', 3));
    const b = makeElite(findEnemy('orc'), streamFor('s', 'elite', 3));
    expect(a.eliteName).toBe(b.eliteName);
    expect(a.eliteModifier).toBe(b.eliteModifier);
    expect(a.deed).toBe(b.deed);
  });

  it('applies the chosen modifier to stats', () => {
    const base = findEnemy('orc');
    // Sweep seeds until each modifier shows, then assert its stat effect.
    const seen = new Set<string>();
    for (let i = 0; i < 200 && seen.size < ELITE_MODIFIERS.length; i++) {
      const e = makeElite(base, streamFor('sweep', i));
      if (seen.has(e.eliteModifier!)) continue;
      seen.add(e.eliteModifier!);
      if (e.eliteModifier === 'ferocious') expect(e.hitDamage).toBeGreaterThan(base.hitDamage);
      if (e.eliteModifier === 'ironhide') expect(e.armor ?? 0).toBeGreaterThan(base.armor ?? 0);
      if (e.eliteModifier === 'swift') expect(e.msPerChar).toBeLessThan(base.msPerChar);
      if (e.eliteModifier === 'venomous') expect(e.poison ?? 0).toBeGreaterThan(base.poison ?? 0);
      if (e.eliteModifier === 'relentless') expect(e.comboChance).toBeGreaterThan(base.comboChance);
    }
    expect(seen.size).toBe(ELITE_MODIFIERS.length);
  });

  it('exposes modifier and deed lines for elites and nothing for plain foes', () => {
    const elite = makeElite(findEnemy('orc'), streamFor('e', 9));
    expect(eliteModifierLine(elite)?.key).toBe(`elitemod_${elite.eliteModifier}`);
    expect(deedLine(elite)?.key).toBe(`deed_${elite.deed}`);
    expect(eliteModifierLine(findEnemy('orc'))).toBeNull();
    expect(deedLine(findEnemy('orc'))).toBeNull();
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

  it('is reproducible from a seeded stream', () => {
    const a = endlessCandidates(3, streamFor('s', 'foes', 3)).map((e) => e.id);
    const b = endlessCandidates(3, streamFor('s', 'foes', 3)).map((e) => e.id);
    expect(a).toEqual(b);
  });
});
