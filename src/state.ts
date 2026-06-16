import { endlessCandidates, findEnemy, RUN_LENGTH, type Enemy } from './enemies';
import { streamFor, unseededRng, type Rng } from './rng';
import type { HeroClass } from './classes';

export type RunMode = 'classic' | 'endless';

export interface PlayerStats {
  maxHP: number;
  hp: number;
  atkMult: number;
  level: number;
  defense: number;
  critChance: number;
  critMult: number;
  lifesteal: number;
  comboBonus: number;
  timeFactor: number;
  regen: number;
  // Banked incantation charge — persists across fights within a run.
  // Optional so runs saved before mana existed still resume cleanly.
  mana?: number;
  // Boon school tallies and the sets they've awakened. Optional so older
  // saves resume cleanly; initialized lazily as boons are claimed.
  schoolCounts?: Partial<Record<School, number>>;
  awakenedSets?: School[];
}

// Boons belong to one of three schools; collecting three of a school awakens
// its set bonus — a one-time stat surge that rewards leaning into a theme.
export type School = 'blood' | 'holy' | 'steel';
export const SCHOOLS: School[] = ['blood', 'holy', 'steel'];
export const SET_THRESHOLD = 3;

export type Modifier = 'refuge' | 'empower';

export interface RunState {
  player: PlayerStats;
  heroClass: HeroClass;
  mode: RunMode;
  seed: string;
  daily: boolean;
  fightNumber: number;
  defeated: number;
  upcomingEnemy: Enemy;
  pendingHeal: number;
  pendingMaxHPBoost: number;
  // Extra rerolls granted by a completed elite deed, spent at the next level-up.
  bonusRerolls?: number;
  // The subclass this hero ascended into mid-run, if any.
  subclassId?: string;
}

const STARTING_HP = 100;

function baseStats(): PlayerStats {
  return {
    maxHP: STARTING_HP,
    hp: STARTING_HP,
    atkMult: 1.0,
    level: 1,
    defense: 0,
    critChance: 0,
    critMult: 2.0,
    lifesteal: 0,
    comboBonus: 0,
    timeFactor: 1.0,
    regen: 0,
    mana: 0,
  };
}

export function classPreview(heroClass: HeroClass): PlayerStats {
  const p = { ...baseStats(), ...heroClass.stats };
  p.hp = p.maxHP;
  return p;
}

export function newRun(heroClass: HeroClass, mode: RunMode, seed: string, daily = false): RunState {
  const firstEnemy =
    mode === 'endless' ? endlessCandidates(1, streamFor(seed, 'foes', 1))[0] : findEnemy('goblin');
  return {
    player: classPreview(heroClass),
    heroClass,
    mode,
    seed,
    daily,
    fightNumber: 1,
    defeated: 0,
    upcomingEnemy: firstEnemy,
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
  if (p.critChance > 0)
    lines.push({ key: 'stat_crit', value: `${Math.round(p.critChance * 100)}%` });
  if (p.critMult > 2) lines.push({ key: 'stat_critdmg', value: `${p.critMult.toFixed(1)}×` });
  if (p.lifesteal > 0)
    lines.push({ key: 'stat_lifesteal', value: `${Math.round(p.lifesteal * 100)}%` });
  if (p.comboBonus > 0)
    lines.push({ key: 'stat_combo', value: `+${Math.round(p.comboBonus * 100)}%` });
  if (p.timeFactor > 1)
    lines.push({ key: 'stat_focus', value: `+${Math.round((p.timeFactor - 1) * 100)}%` });
  if (p.regen > 0) lines.push({ key: 'stat_regen', value: `+${p.regen}` });
  return lines;
}

export function isRunComplete(run: RunState): boolean {
  return run.mode === 'classic' && run.defeated >= RUN_LENGTH;
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
  school: School;
  apply: (p: PlayerStats) => void;
}

export const upgrades: Upgrade[] = [
  {
    id: 'might',
    nameKey: 'upgrade_might',
    descKey: 'upgrade_might_desc',
    icon: '⚔',
    school: 'steel',
    apply: (p) => {
      p.atkMult = Math.round(p.atkMult * 120) / 100;
    },
  },
  {
    id: 'vigor',
    nameKey: 'upgrade_vigor',
    descKey: 'upgrade_vigor_desc',
    icon: '❦',
    school: 'holy',
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
    school: 'holy',
    apply: (p) => {
      p.hp = p.maxHP;
    },
  },
  {
    id: 'bulwark',
    nameKey: 'upgrade_bulwark',
    descKey: 'upgrade_bulwark_desc',
    icon: '❖',
    school: 'steel',
    apply: (p) => {
      p.defense += 4;
    },
  },
  {
    id: 'precision',
    nameKey: 'upgrade_precision',
    descKey: 'upgrade_precision_desc',
    icon: '✦',
    school: 'blood',
    apply: (p) => {
      p.critChance = Math.min(0.8, Math.round((p.critChance + 0.2) * 100) / 100);
    },
  },
  {
    id: 'bloodthirst',
    nameKey: 'upgrade_bloodthirst',
    descKey: 'upgrade_bloodthirst_desc',
    icon: '♥',
    school: 'blood',
    apply: (p) => {
      p.lifesteal = Math.min(0.6, Math.round((p.lifesteal + 0.15) * 100) / 100);
    },
  },
  {
    id: 'frenzy',
    nameKey: 'upgrade_frenzy',
    descKey: 'upgrade_frenzy_desc',
    icon: '✺',
    school: 'blood',
    apply: (p) => {
      p.comboBonus = Math.round((p.comboBonus + 0.4) * 100) / 100;
    },
  },
  {
    id: 'focus',
    nameKey: 'upgrade_focus',
    descKey: 'upgrade_focus_desc',
    icon: '◷',
    school: 'steel',
    apply: (p) => {
      p.timeFactor = Math.round((p.timeFactor + 0.12) * 100) / 100;
    },
  },
  {
    id: 'renewal',
    nameKey: 'upgrade_renewal',
    descKey: 'upgrade_renewal_desc',
    icon: '⟳',
    school: 'holy',
    apply: (p) => {
      p.regen += 2;
    },
  },
  {
    id: 'execution',
    nameKey: 'upgrade_execution',
    descKey: 'upgrade_execution_desc',
    icon: '☠',
    school: 'blood',
    apply: (p) => {
      p.critMult = Math.min(4, Math.round((p.critMult + 0.5) * 10) / 10);
    },
  },
  {
    id: 'sentinel',
    nameKey: 'upgrade_sentinel',
    descKey: 'upgrade_sentinel_desc',
    icon: '⛨',
    school: 'steel',
    apply: (p) => {
      p.defense += 3;
      p.maxHP += 15;
      p.hp = Math.min(p.maxHP, p.hp + 15);
    },
  },
];

export interface SetBonus {
  school: School;
  nameKey: string;
  descKey: string;
  icon: string;
  apply: (p: PlayerStats) => void;
}

// One set per school, awakened at SET_THRESHOLD boons of that school. Effects
// are pure stat surges (no fight wiring), themed to the school's identity.
export const setBonuses: Record<School, SetBonus> = {
  blood: {
    school: 'blood',
    nameKey: 'set_blood',
    descKey: 'set_blood_desc',
    icon: '🩸',
    apply: (p) => {
      p.lifesteal = Math.min(0.6, Math.round((p.lifesteal + 0.15) * 100) / 100);
      p.critMult = Math.min(4, Math.round((p.critMult + 0.3) * 10) / 10);
    },
  },
  holy: {
    school: 'holy',
    nameKey: 'set_holy',
    descKey: 'set_holy_desc',
    icon: '☀',
    apply: (p) => {
      p.maxHP += 20;
      p.hp = Math.min(p.maxHP, p.hp + 20);
      p.regen += 2;
    },
  },
  steel: {
    school: 'steel',
    nameKey: 'set_steel',
    descKey: 'set_steel_desc',
    icon: '⛨',
    apply: (p) => {
      p.defense += 3;
      p.atkMult = Math.round(p.atkMult * 115) / 100;
    },
  },
};

// Claim a boon: apply it, tally its school, and awaken that school's set the
// moment the third is collected. Returns the school whose set just awakened
// (for UI feedback), or null.
export function applyBoon(player: PlayerStats, up: Upgrade): School | null {
  up.apply(player);
  const counts = (player.schoolCounts ??= {});
  counts[up.school] = (counts[up.school] ?? 0) + 1;
  const awakened = (player.awakenedSets ??= []);
  if (counts[up.school]! >= SET_THRESHOLD && !awakened.includes(up.school)) {
    awakened.push(up.school);
    setBonuses[up.school].apply(player);
    return up.school;
  }
  return null;
}

const FAVORED_WEIGHT = 3;

export function drawBoons(
  count: number,
  favored: string[] = [],
  rng: Rng = unseededRng,
): Upgrade[] {
  const favoredSet = new Set(favored);
  const remaining = upgrades.map((u) => ({ u, w: favoredSet.has(u.id) ? FAVORED_WEIGHT : 1 }));
  const picked: Upgrade[] = [];
  const n = Math.min(count, remaining.length);
  while (picked.length < n) {
    const idx = rng.weightedIndex(remaining.map((e) => e.w));
    picked.push(remaining[idx].u);
    remaining.splice(idx, 1);
  }
  return picked;
}
