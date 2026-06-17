// Story events — seeded '?' interludes between fights. Each is a *rite*: walk
// on and risk nothing, or perform it (type the litany in time and cleanly) to
// earn a blessing — fail, and you're left with a scar. This module is the pure
// logic (templates + resolution); the screen lives in eventscreen.ts.

import { applyCharm, findCharm, type CharmKind } from './charms';
import { unseededRng, type Rng } from './rng';
import type { PlayerStats } from './state';

interface EventDef {
  id: string;
  accent: string; // accent class suffix (school-themed coloring)
  blessingId: string; // charm granted when the rite succeeds
  scarId: string; // charm inflicted when it fails
}

// Per-character time budget for the litany; finish within it (and cleanly) to
// succeed the rite.
export const EVENT_MS_PER_CHAR = 320;

// Accuracy floor for a successful rite — a mashed litany fails (and scars you).
export const RITE_MIN_ACCURACY = 0.8;

const EVENTS: EventDef[] = [
  { id: 'shrine', accent: 'holy', blessingId: 'sanctified', scarId: 'forsaken' },
  { id: 'wellspring', accent: 'arcane', blessingId: 'clarity', scarId: 'clouded' },
  { id: 'oath_stone', accent: 'steel', blessingId: 'resolute', scarId: 'cracked' },
  { id: 'ember_altar', accent: 'blood', blessingId: 'emberblood', scarId: 'withered' },
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

export interface RiteResult {
  kind: CharmKind; // 'blessing' on success, 'scar' on failure
  charmId: string; // the charm granted/inflicted (already applied to player)
}

// Resolve a performed rite: apply its blessing on success or its scar on
// failure, and report which charm landed (so the run can record it).
export function resolveRite(player: PlayerStats, id: string, success: boolean): RiteResult {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`Unknown event: ${id}`);
  const charm = findCharm(success ? def.blessingId : def.scarId);
  applyCharm(player, charm);
  return { kind: charm.kind, charmId: charm.id };
}
