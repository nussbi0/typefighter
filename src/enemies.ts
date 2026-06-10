import { unseededRng, type Rng } from './rng';

// Typing debuffs a foe's landed hit inflicts on your next few words:
// scramble — letters arrive jumbled (type them as shown);
// fog — only the next letter shows, the rest is shrouded;
// mirror — the word is displayed flipped back-to-front.
export type Affliction = 'scramble' | 'fog' | 'mirror';

export interface PhaseChange {
  triggerHPRatio: number;
  msPerChar: number;
  spawnDelayMs: number;
  comboChance: number;
}

export interface Enemy {
  id: string;
  nameKey: string;
  sprite: string;
  maxHP: number;
  hitDamage: number;
  msPerChar: number;
  spawnDelayMs: number;
  comboChance: number;
  comboMaxWords: number;
  tier: 1 | 2 | 3 | 4 | 5;
  phaseChange?: PhaseChange;
  isBoss?: boolean;
  // Special abilities (optional):
  armor?: number; // flat reduction of damage you deal
  regen?: number; // HP the foe heals each time it spawns a word
  lifesteal?: number; // fraction of damage dealt to you that heals the foe
  poison?: number; // stacks applied when it hits you (ticking damage over time)
  afflict?: Affliction; // typing debuff its hits inflict for a few words
}

export const roster: Enemy[] = [
  // Tier 1 — intro
  {
    id: 'goblin',
    nameKey: 'enemy_goblin',
    sprite: '👹',
    maxHP: 80,
    hitDamage: 14,
    msPerChar: 420,
    spawnDelayMs: 600,
    comboChance: 0.1,
    comboMaxWords: 2,
    tier: 1,
  },
  {
    id: 'bat',
    nameKey: 'enemy_bat',
    sprite: '🦇',
    maxHP: 60,
    hitDamage: 10,
    msPerChar: 300,
    spawnDelayMs: 460,
    comboChance: 0.2,
    comboMaxWords: 2,
    tier: 1,
  },
  // Tier 2
  {
    id: 'wolf',
    nameKey: 'enemy_wolf',
    sprite: '🐺',
    maxHP: 110,
    hitDamage: 16,
    msPerChar: 360,
    spawnDelayMs: 500,
    comboChance: 0.15,
    comboMaxWords: 2,
    tier: 2,
  },
  {
    id: 'skeleton',
    nameKey: 'enemy_skeleton',
    sprite: '💀',
    maxHP: 100,
    hitDamage: 14,
    msPerChar: 340,
    spawnDelayMs: 480,
    comboChance: 0.22,
    comboMaxWords: 2,
    tier: 2,
  },
  {
    id: 'spider',
    nameKey: 'enemy_spider',
    sprite: '🕷️',
    maxHP: 105,
    hitDamage: 15,
    msPerChar: 320,
    spawnDelayMs: 440,
    comboChance: 0.28,
    comboMaxWords: 2,
    tier: 2,
    poison: 3,
  },
  // Tier 3
  {
    id: 'orc',
    nameKey: 'enemy_orc',
    sprite: '👺',
    maxHP: 150,
    hitDamage: 20,
    msPerChar: 360,
    spawnDelayMs: 500,
    comboChance: 0.3,
    comboMaxWords: 2,
    tier: 3,
  },
  {
    id: 'troll',
    nameKey: 'enemy_troll',
    sprite: '🧌',
    maxHP: 190,
    hitDamage: 22,
    msPerChar: 440,
    spawnDelayMs: 540,
    comboChance: 0.18,
    comboMaxWords: 2,
    tier: 3,
    regen: 5,
  },
  {
    id: 'boar',
    nameKey: 'enemy_boar',
    sprite: '🐗',
    maxHP: 175,
    hitDamage: 24,
    msPerChar: 460,
    spawnDelayMs: 560,
    comboChance: 0.12,
    comboMaxWords: 2,
    tier: 3,
  },
  // Tier 4
  {
    id: 'sorcerer',
    nameKey: 'enemy_sorcerer',
    sprite: '🧙',
    maxHP: 130,
    hitDamage: 24,
    msPerChar: 320,
    spawnDelayMs: 450,
    comboChance: 0.5,
    comboMaxWords: 3,
    tier: 4,
    afflict: 'scramble',
  },
  {
    id: 'ghost',
    nameKey: 'enemy_ghost',
    sprite: '👻',
    maxHP: 120,
    hitDamage: 22,
    msPerChar: 280,
    spawnDelayMs: 400,
    comboChance: 0.6,
    comboMaxWords: 3,
    tier: 4,
    afflict: 'fog',
  },
  {
    id: 'golem',
    nameKey: 'enemy_golem',
    sprite: '🗿',
    maxHP: 215,
    hitDamage: 26,
    msPerChar: 420,
    spawnDelayMs: 540,
    comboChance: 0.2,
    comboMaxWords: 2,
    tier: 4,
    armor: 6,
  },
  {
    id: 'vampire',
    nameKey: 'enemy_vampire',
    sprite: '🧛',
    maxHP: 145,
    hitDamage: 22,
    msPerChar: 300,
    spawnDelayMs: 420,
    comboChance: 0.45,
    comboMaxWords: 3,
    tier: 4,
    lifesteal: 0.5,
    afflict: 'mirror',
  },
  // Bosses
  {
    id: 'dragon',
    nameKey: 'enemy_dragon',
    sprite: '🐉',
    maxHP: 240,
    hitDamage: 28,
    msPerChar: 300,
    spawnDelayMs: 420,
    comboChance: 0.35,
    comboMaxWords: 3,
    tier: 5,
    phaseChange: {
      triggerHPRatio: 0.5,
      msPerChar: 240,
      spawnDelayMs: 340,
      comboChance: 0.55,
    },
    isBoss: true,
  },
  {
    id: 'demon',
    nameKey: 'enemy_demon',
    sprite: '😈',
    maxHP: 230,
    hitDamage: 27,
    msPerChar: 280,
    spawnDelayMs: 400,
    comboChance: 0.5,
    comboMaxWords: 3,
    tier: 5,
    phaseChange: {
      triggerHPRatio: 0.5,
      msPerChar: 230,
      spawnDelayMs: 320,
      comboChance: 0.7,
    },
    isBoss: true,
    lifesteal: 0.4,
  },
  {
    id: 'kraken',
    nameKey: 'enemy_kraken',
    sprite: '🦑',
    maxHP: 285,
    hitDamage: 26,
    msPerChar: 320,
    spawnDelayMs: 440,
    comboChance: 0.4,
    comboMaxWords: 3,
    tier: 5,
    phaseChange: {
      triggerHPRatio: 0.5,
      msPerChar: 260,
      spawnDelayMs: 360,
      comboChance: 0.6,
    },
    isBoss: true,
    regen: 7,
  },
];

export const RUN_LENGTH = 5;

export function findEnemy(id: string): Enemy {
  const e = roster.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown enemy: ${id}`);
  return e;
}

export function enemiesByTier(tier: number): Enemy[] {
  return roster.filter((e) => e.tier === tier);
}

// --- Endless mode -----------------------------------------------------------

export const ENDLESS_BOSS_EVERY = 5;

function scalePhase(phase: PhaseChange, speedScale: number, comboAdd: number): PhaseChange {
  return {
    triggerHPRatio: phase.triggerHPRatio,
    msPerChar: Math.round(phase.msPerChar * speedScale),
    spawnDelayMs: Math.round(phase.spawnDelayMs * speedScale),
    comboChance: Math.min(0.9, phase.comboChance + comboAdd),
  };
}

// Produce a depth-scaled copy of a base enemy: tougher, faster, and more
// combo-prone the deeper the endless run goes.
export function scaleEnemy(base: Enemy, depth: number): Enemy {
  const steps = depth - 1;
  const hpScale = 1 + 0.2 * steps;
  const dmgScale = 1 + 0.1 * steps;
  const speedScale = Math.max(0.5, 1 - 0.02 * steps);
  const comboAdd = Math.min(0.4, 0.015 * steps);
  return {
    ...base,
    id: `${base.id}@${depth}`,
    maxHP: Math.round(base.maxHP * hpScale),
    hitDamage: Math.round(base.hitDamage * dmgScale),
    msPerChar: Math.round(base.msPerChar * speedScale),
    spawnDelayMs: Math.round(base.spawnDelayMs * speedScale),
    comboChance: Math.min(0.9, base.comboChance + comboAdd),
    phaseChange: base.phaseChange ? scalePhase(base.phaseChange, speedScale, comboAdd) : undefined,
    armor: base.armor != null ? Math.round(base.armor * dmgScale) : undefined,
    regen: base.regen != null ? Math.round(base.regen * hpScale) : undefined,
    poison: base.poison != null ? Math.round(base.poison * dmgScale) : undefined,
    lifesteal: base.lifesteal,
  };
}

export interface AbilityLine {
  key: string; // short tag label (may take a {n} value)
  tip: string; // i18n key for the full explanation (tooltip + guide)
  value?: number;
}

// Localizable ability tags for previews (encounter / branch screens).
export function enemyAbilities(enemy: Enemy): AbilityLine[] {
  const lines: AbilityLine[] = [];
  if (enemy.armor)
    lines.push({ key: 'ability_armor', tip: 'ability_armor_tip', value: enemy.armor });
  if (enemy.regen)
    lines.push({ key: 'ability_regen', tip: 'ability_regen_tip', value: enemy.regen });
  if (enemy.lifesteal) lines.push({ key: 'ability_lifesteal', tip: 'ability_lifesteal_tip' });
  if (enemy.poison) lines.push({ key: 'ability_poison', tip: 'ability_poison_tip' });
  if (enemy.afflict)
    lines.push({ key: `ability_${enemy.afflict}`, tip: `ability_${enemy.afflict}_tip` });
  return lines;
}

export function isEndlessBossDepth(depth: number): boolean {
  return depth % ENDLESS_BOSS_EVERY === 0;
}

// Two scaled enemy choices for a given endless depth. Every fifth depth is a
// boss gauntlet; otherwise the pool of base foes widens as depth increases.
export function endlessCandidates(depth: number, rng: Rng = unseededRng): Enemy[] {
  const pool = isEndlessBossDepth(depth)
    ? roster.filter((e) => e.isBoss)
    : roster.filter((e) => !e.isBoss && e.tier <= Math.min(4, 1 + Math.floor((depth - 1) / 2)));
  const picks = rng.shuffle(pool).slice(0, Math.min(2, pool.length));
  return picks.map((b) => scaleEnemy(b, depth));
}
