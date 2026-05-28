import { findEnemy, RUN_LENGTH, type Enemy } from './enemies';

export interface PlayerStats {
  maxHP: number;
  hp: number;
  atkMult: number;
  level: number;
  defense: number;
  critChance: number;
  lifesteal: number;
  comboBonus: number;
  timeFactor: number;
  regen: number;
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
    player: {
      maxHP: STARTING_HP,
      hp: STARTING_HP,
      atkMult: 1.0,
      level: 1,
      defense: 0,
      critChance: 0,
      lifesteal: 0,
      comboBonus: 0,
      timeFactor: 1.0,
      regen: 0,
    },
    fightNumber: 1,
    defeated: 0,
    upcomingEnemy: findEnemy('goblin'),
    pendingHeal: 0,
    pendingMaxHPBoost: 0,
  };
}

export interface CombatStatLine {
  key: string;
  value: string;
}

export function combatStatLines(p: PlayerStats): CombatStatLine[] {
  const lines: CombatStatLine[] = [];
  if (p.defense > 0) lines.push({ key: 'stat_def', value: String(p.defense) });
  if (p.critChance > 0) lines.push({ key: 'stat_crit', value: `${Math.round(p.critChance * 100)}%` });
  if (p.lifesteal > 0) lines.push({ key: 'stat_lifesteal', value: `${Math.round(p.lifesteal * 100)}%` });
  if (p.comboBonus > 0) lines.push({ key: 'stat_combo', value: `+${Math.round(p.comboBonus * 100)}%` });
  if (p.timeFactor > 1) lines.push({ key: 'stat_focus', value: `+${Math.round((p.timeFactor - 1) * 100)}%` });
  if (p.regen > 0) lines.push({ key: 'stat_regen', value: `+${p.regen}` });
  return lines;
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
  {
    id: 'bulwark',
    nameKey: 'upgrade_bulwark',
    descKey: 'upgrade_bulwark_desc',
    icon: '❖',
    apply: (p) => {
      p.defense += 4;
    },
  },
  {
    id: 'precision',
    nameKey: 'upgrade_precision',
    descKey: 'upgrade_precision_desc',
    icon: '✦',
    apply: (p) => {
      p.critChance = Math.min(0.8, Math.round((p.critChance + 0.2) * 100) / 100);
    },
  },
  {
    id: 'bloodthirst',
    nameKey: 'upgrade_bloodthirst',
    descKey: 'upgrade_bloodthirst_desc',
    icon: '♥',
    apply: (p) => {
      p.lifesteal = Math.min(0.6, Math.round((p.lifesteal + 0.15) * 100) / 100);
    },
  },
  {
    id: 'frenzy',
    nameKey: 'upgrade_frenzy',
    descKey: 'upgrade_frenzy_desc',
    icon: '✺',
    apply: (p) => {
      p.comboBonus = Math.round((p.comboBonus + 0.4) * 100) / 100;
    },
  },
  {
    id: 'focus',
    nameKey: 'upgrade_focus',
    descKey: 'upgrade_focus_desc',
    icon: '◷',
    apply: (p) => {
      p.timeFactor = Math.round((p.timeFactor + 0.12) * 100) / 100;
    },
  },
  {
    id: 'renewal',
    nameKey: 'upgrade_renewal',
    descKey: 'upgrade_renewal_desc',
    icon: '⟳',
    apply: (p) => {
      p.regen += 2;
    },
  },
];

export function drawBoons(count: number): Upgrade[] {
  const pool = [...upgrades];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
