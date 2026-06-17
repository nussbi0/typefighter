// Charms — persistent run modifiers won or suffered at story-event rites.
// A blessing is an upside, a scar a downside; both ride the whole run as a
// visible collection (like relics). They're pure stat warps applied once on
// acquisition, so no fight wiring is needed.

import type { PlayerStats } from './state';

export type CharmKind = 'blessing' | 'scar';

export interface Charm {
  id: string;
  kind: CharmKind;
  nameKey: string;
  descKey: string;
  icon: string;
  apply: (p: PlayerStats) => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const charms: Charm[] = [
  // --- Blessings (rite succeeded) ---
  {
    id: 'sanctified',
    kind: 'blessing',
    nameKey: 'charm_sanctified',
    descKey: 'charm_sanctified_desc',
    icon: '✨',
    apply: (p) => {
      p.regen += 2;
      p.hp = Math.min(p.maxHP, p.hp + 25);
    },
  },
  {
    id: 'clarity',
    kind: 'blessing',
    nameKey: 'charm_clarity',
    descKey: 'charm_clarity_desc',
    icon: '🔮',
    apply: (p) => {
      p.timeFactor = round2(p.timeFactor + 0.08);
    },
  },
  {
    id: 'resolute',
    kind: 'blessing',
    nameKey: 'charm_resolute',
    descKey: 'charm_resolute_desc',
    icon: '🛡',
    apply: (p) => {
      p.defense += 3;
    },
  },
  {
    id: 'emberblood',
    kind: 'blessing',
    nameKey: 'charm_emberblood',
    descKey: 'charm_emberblood_desc',
    icon: '🔥',
    apply: (p) => {
      p.atkMult = round2(p.atkMult + 0.12);
      p.lifesteal = Math.min(0.8, round2(p.lifesteal + 0.1));
    },
  },
  // --- Scars (rite failed) ---
  {
    id: 'forsaken',
    kind: 'scar',
    nameKey: 'charm_forsaken',
    descKey: 'charm_forsaken_desc',
    icon: '☠',
    apply: (p) => {
      p.maxHP = Math.max(1, p.maxHP - 12);
      p.hp = Math.min(p.hp, p.maxHP);
    },
  },
  {
    id: 'clouded',
    kind: 'scar',
    nameKey: 'charm_clouded',
    descKey: 'charm_clouded_desc',
    icon: '🌫',
    apply: (p) => {
      p.timeFactor = Math.max(0.7, round2(p.timeFactor - 0.08));
    },
  },
  {
    id: 'cracked',
    kind: 'scar',
    nameKey: 'charm_cracked',
    descKey: 'charm_cracked_desc',
    icon: '💔',
    apply: (p) => {
      p.defense = Math.max(-5, p.defense - 3);
    },
  },
  {
    id: 'withered',
    kind: 'scar',
    nameKey: 'charm_withered',
    descKey: 'charm_withered_desc',
    icon: '🥀',
    apply: (p) => {
      p.atkMult = Math.max(0.5, round2(p.atkMult - 0.12));
    },
  },
];

export function findCharm(id: string): Charm {
  const c = charms.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown charm: ${id}`);
  return c;
}

export function applyCharm(player: PlayerStats, charm: Charm): void {
  charm.apply(player);
}
