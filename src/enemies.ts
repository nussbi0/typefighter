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
  },
  // Boss
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
