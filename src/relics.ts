// Relics — rarer than boons and build-defining, drafted only after defeating
// an elite. Some are immediate stat warps (Sanguine Pact); most carry runtime
// effects that fight.ts folds together and reads each fight.

import { unseededRng, type Rng } from './rng';
import type { PlayerStats } from './state';

export interface RelicEffects {
  damageDealtMult: number; // scales all damage you deal
  damageTakenMult: number; // scales all damage you take
  critEveryN: number; // force a crit every Nth strike (0 = off)
  cheatDeath: boolean; // survive one lethal blow per fight at 1 HP
  manaOnPerfect: number; // extra mana per Perfect strike
  overdriveBonusMs: number; // Overdrive lasts this much longer
}

export const BASE_RELIC_EFFECTS: RelicEffects = {
  damageDealtMult: 1,
  damageTakenMult: 1,
  critEveryN: 0,
  cheatDeath: false,
  manaOnPerfect: 0,
  overdriveBonusMs: 0,
};

export interface Relic {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  apply?: (p: PlayerStats) => void; // immediate stat warp on acquisition
  effects?: Partial<RelicEffects>; // runtime effects, folded in fight.ts
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const relics: Relic[] = [
  {
    id: 'metronome',
    nameKey: 'relic_metronome',
    descKey: 'relic_metronome_desc',
    icon: '⏱',
    effects: { critEveryN: 13 },
  },
  {
    id: 'glass_cannon',
    nameKey: 'relic_glass_cannon',
    descKey: 'relic_glass_cannon_desc',
    icon: '💥',
    effects: { damageDealtMult: 1.5, damageTakenMult: 1.3 },
  },
  {
    id: 'sanguine_pact',
    nameKey: 'relic_sanguine_pact',
    descKey: 'relic_sanguine_pact_desc',
    icon: '🩸',
    apply: (p) => {
      p.lifesteal = Math.min(0.8, round2(p.lifesteal + 0.4));
      p.maxHP = Math.max(1, Math.round(p.maxHP / 2));
      p.hp = Math.min(p.maxHP, p.hp);
    },
  },
  {
    id: 'phoenix_feather',
    nameKey: 'relic_phoenix_feather',
    descKey: 'relic_phoenix_feather_desc',
    icon: '🔥',
    effects: { cheatDeath: true },
  },
  {
    id: 'arcane_focus',
    nameKey: 'relic_arcane_focus',
    descKey: 'relic_arcane_focus_desc',
    icon: '🔮',
    effects: { manaOnPerfect: 1 },
  },
  {
    id: 'warbanner',
    nameKey: 'relic_warbanner',
    descKey: 'relic_warbanner_desc',
    icon: '🚩',
    effects: { overdriveBonusMs: 3000 },
  },
];

export function findRelic(id: string): Relic {
  const r = relics.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown relic: ${id}`);
  return r;
}

// Fold every held relic's runtime effects over the base values.
export function relicEffects(ids: string[] = []): RelicEffects {
  const e = { ...BASE_RELIC_EFFECTS };
  for (const id of ids) {
    const x = relics.find((r) => r.id === id)?.effects;
    if (!x) continue;
    if (x.damageDealtMult) e.damageDealtMult *= x.damageDealtMult;
    if (x.damageTakenMult) e.damageTakenMult *= x.damageTakenMult;
    if (x.critEveryN)
      e.critEveryN = e.critEveryN ? Math.min(e.critEveryN, x.critEveryN) : x.critEveryN;
    if (x.cheatDeath) e.cheatDeath = true;
    if (x.manaOnPerfect) e.manaOnPerfect += x.manaOnPerfect;
    if (x.overdriveBonusMs) e.overdriveBonusMs += x.overdriveBonusMs;
  }
  return e;
}

// Apply a relic's immediate stat warp (no-op for purely runtime relics).
export function applyRelic(player: PlayerStats, relic: Relic): void {
  relic.apply?.(player);
}

// Draw up to `count` relics not already held, from a seeded stream.
export function drawRelics(held: string[] = [], count = 3, rng: Rng = unseededRng): Relic[] {
  const pool = relics.filter((r) => !held.includes(r.id));
  return rng.shuffle(pool).slice(0, Math.min(count, pool.length));
}
