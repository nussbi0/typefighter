import { findEnemy, RUN_LENGTH, type Enemy } from './enemies';

export interface PlayerStats {
  maxHP: number;
  hp: number;
  atkMult: number;
  level: number;
}

export type Modifier = 'refuge' | 'empower';

export interface RunState {
  player: PlayerStats;
  fightNumber: number;
  defeated: number;
  upcomingEnemy: Enemy;
  pendingHeal: number;
  pendingMaxHPBoost: number;
}

const STARTING_HP = 100;

export function newRun(): RunState {
  return {
    player: { maxHP: STARTING_HP, hp: STARTING_HP, atkMult: 1.0, level: 1 },
    fightNumber: 1,
    defeated: 0,
    upcomingEnemy: findEnemy('goblin'),
    pendingHeal: 0,
    pendingMaxHPBoost: 0,
  };
}

export function isRunComplete(run: RunState): boolean {
  return run.defeated >= RUN_LENGTH;
}

export function advance(run: RunState): void {
  run.defeated += 1;
  run.player.level += 1;
}

export function applyModifier(run: RunState, mod: Modifier): void {
  if (mod === 'refuge') {
    run.pendingHeal += 25;
  } else if (mod === 'empower') {
    run.pendingMaxHPBoost += 15;
    run.pendingHeal += 15;
  }
}

export interface AppliedPending {
  healed: number;
  maxBoosted: number;
}

export function applyPending(run: RunState): AppliedPending {
  const maxBoosted = run.pendingMaxHPBoost;
  if (maxBoosted > 0) {
    run.player.maxHP += maxBoosted;
    run.pendingMaxHPBoost = 0;
  }
  const room = run.player.maxHP - run.player.hp;
  const healed = Math.min(room, run.pendingHeal);
  if (healed > 0) {
    run.player.hp += healed;
  }
  run.pendingHeal = 0;
  return { healed, maxBoosted };
}

export interface Upgrade {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  apply: (p: PlayerStats) => void;
}

export const upgrades: Upgrade[] = [
  {
    id: 'might',
    nameKey: 'upgrade_might',
    descKey: 'upgrade_might_desc',
    icon: '⚔',
    apply: (p) => {
      p.atkMult = Math.round(p.atkMult * 120) / 100;
    },
  },
  {
    id: 'vigor',
    nameKey: 'upgrade_vigor',
    descKey: 'upgrade_vigor_desc',
    icon: '❦',
    apply: (p) => {
      p.maxHP += 25;
      p.hp = Math.min(p.maxHP, p.hp + 25);
    },
  },
  {
    id: 'mend',
    nameKey: 'upgrade_mend',
    descKey: 'upgrade_mend_desc',
    icon: '✚',
    apply: (p) => {
      p.hp = p.maxHP;
    },
  },
];
