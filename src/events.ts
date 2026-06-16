// Story events — seeded '?' interludes between fights, resolved by a typing
// challenge. Finish the litany flawlessly (and in time) for a full blessing;
// stumble and you still earn a faint one; walk away and you gain nothing.
// This module is the pure logic (templates + reward); the screen lives in
// eventscreen.ts.

import { unseededRng, type Rng } from './rng';
import type { PlayerStats } from './state';

export type EventOutcome = 'blessing' | 'faint' | 'skipped';

export interface EventReward {
  outcome: EventOutcome;
  healed: number;
  buffKey: string | null; // i18n key naming the bonus, or null
}

interface EventDef {
  id: string;
  accent: string; // accent class suffix (school-themed coloring)
  baseHeal: number; // healed on any completion
  blessingHeal: number; // healed on a flawless completion
  buffKey: string; // i18n key for the blessing's stat bonus
  applyBuff: (p: PlayerStats) => void;
}

// Per-character time budget for the litany; finishing within it (and with no
// typos) earns the full blessing.
export const EVENT_MS_PER_CHAR = 320;

const EVENTS: EventDef[] = [
  {
    id: 'shrine',
    accent: 'holy',
    baseHeal: 15,
    blessingHeal: 25,
    buffKey: 'event_buff_regen',
    applyBuff: (p) => {
      p.regen += 2;
    },
  },
  {
    id: 'wellspring',
    accent: 'arcane',
    baseHeal: 12,
    blessingHeal: 20,
    buffKey: 'event_buff_focus',
    applyBuff: (p) => {
      p.timeFactor = Math.round((p.timeFactor + 0.06) * 100) / 100;
    },
  },
  {
    id: 'oath_stone',
    accent: 'steel',
    baseHeal: 12,
    blessingHeal: 20,
    buffKey: 'event_buff_defense',
    applyBuff: (p) => {
      p.defense += 2;
    },
  },
  {
    id: 'ember_altar',
    accent: 'blood',
    baseHeal: 10,
    blessingHeal: 18,
    buffKey: 'event_buff_crit',
    applyBuff: (p) => {
      p.critMult = Math.min(4, Math.round((p.critMult + 0.3) * 10) / 10);
    },
  },
];

export interface StoryEvent {
  id: string;
  accent: string;
  titleKey: string;
  flavorKey: string;
  litanyKey: string;
}

export const EVENT_IDS = EVENTS.map((e) => e.id);

function toEvent(def: EventDef): StoryEvent {
  return {
    id: def.id,
    accent: def.accent,
    titleKey: `event_${def.id}_title`,
    flavorKey: `event_${def.id}_flavor`,
    litanyKey: `event_${def.id}_litany`,
  };
}

// Deterministically pick an event from a seeded stream.
export function pickEvent(rng: Rng = unseededRng): StoryEvent {
  return toEvent(rng.pick(EVENTS));
}

export function findEvent(id: string): StoryEvent {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`Unknown event: ${id}`);
  return toEvent(def);
}

// Apply an event's reward to the player. A flawless completion heals more and
// grants the themed stat bonus; a stumble heals a little; walking away does
// nothing.
export function resolveEvent(
  player: PlayerStats,
  id: string,
  opts: { completed: boolean; flawless: boolean },
): EventReward {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`Unknown event: ${id}`);
  if (!opts.completed) return { outcome: 'skipped', healed: 0, buffKey: null };
  const heal = opts.flawless ? def.blessingHeal : def.baseHeal;
  const before = player.hp;
  player.hp = Math.min(player.maxHP, player.hp + heal);
  const healed = player.hp - before;
  if (opts.flawless) def.applyBuff(player);
  return {
    outcome: opts.flawless ? 'blessing' : 'faint',
    healed,
    buffKey: opts.flawless ? def.buffKey : null,
  };
}
