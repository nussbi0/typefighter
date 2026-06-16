import type { PlayerStats } from './state';

export interface HeroClass {
  id: string;
  nameKey: string;
  descKey: string;
  sprite: string;
  stats: Partial<PlayerStats>;
  favoredBoons: string[];
  passive: string; // unique combat mechanic, resolved in fight.ts
  passiveKey: string; // i18n key describing the passive
  spell: string; // incantation ability id (word = spell_<id>_word, desc = spell_<id>_desc)
}

export const classes: HeroClass[] = [
  {
    id: 'knight',
    nameKey: 'class_knight',
    descKey: 'class_knight_desc',
    sprite: '🛡️',
    stats: { maxHP: 125, defense: 3 },
    favoredBoons: ['bulwark', 'vigor', 'mend', 'renewal'],
    passive: 'guard',
    passiveKey: 'passive_knight',
    spell: 'aegis',
  },
  {
    id: 'mage',
    nameKey: 'class_mage',
    descKey: 'class_mage_desc',
    sprite: '🪄',
    stats: { maxHP: 80, comboBonus: 0.3 },
    favoredBoons: ['frenzy', 'focus', 'might', 'precision'],
    passive: 'overload',
    passiveKey: 'passive_mage',
    spell: 'fireball',
  },
  {
    id: 'rogue',
    nameKey: 'class_rogue',
    descKey: 'class_rogue_desc',
    sprite: '🗡️',
    stats: { maxHP: 95, critChance: 0.18 },
    favoredBoons: ['precision', 'might', 'bloodthirst', 'frenzy'],
    passive: 'ambush',
    passiveKey: 'passive_rogue',
    spell: 'eviscerate',
  },
  {
    id: 'templar',
    nameKey: 'class_templar',
    descKey: 'class_templar_desc',
    sprite: '⚜️',
    stats: { maxHP: 115, regen: 1 },
    favoredBoons: ['renewal', 'bulwark', 'sentinel', 'mend'],
    passive: 'consecration',
    passiveKey: 'passive_templar',
    spell: 'smite',
  },
  {
    id: 'berserker',
    nameKey: 'class_berserker',
    descKey: 'class_berserker_desc',
    sprite: '🪓',
    stats: { maxHP: 90, atkMult: 1.15 },
    favoredBoons: ['might', 'frenzy', 'execution', 'bloodthirst'],
    passive: 'bloodlust',
    passiveKey: 'passive_berserker',
    spell: 'rampage',
  },
];

export function findClass(id: string): HeroClass {
  const c = classes.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown class: ${id}`);
  return c;
}

// --- Class evolutions -------------------------------------------------------
// Mid-run, a hero ascends into one of two subclasses. Rather than ten bespoke
// combat behaviors, a subclass is a stat bonus plus a set of parameters that
// tune the hero's existing passive and spell (resolved in fight.ts).

export interface EvoParams {
  spellPower: number; // scales a cast spell's own damage and healing
  spellSmite: number; // extra damage (in BASE_DAMAGE units) added to any cast
  overloadEvery: number; // Mage Overload cadence (every Nth strike)
  guardCharges: number; // Knight Guard: how many early hits it halves
  ambushStrikes: number; // Rogue Ambush: how many opening strikes auto-crit
  bloodlustScale: number; // Berserker Bloodlust: missing-HP damage scaling
  consecrationHeal: number; // Templar Consecration: heal at each fight's start
}

export const BASE_EVO: EvoParams = {
  spellPower: 1,
  spellSmite: 0,
  overloadEvery: 4,
  guardCharges: 1,
  ambushStrikes: 1,
  bloodlustScale: 0.5,
  consecrationHeal: 12,
};

export interface Subclass {
  id: string;
  classId: string;
  nameKey: string;
  descKey: string;
  apply: (p: PlayerStats) => void; // stat bonus granted on ascension
  params: Partial<EvoParams>; // overrides folded over BASE_EVO in fight.ts
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const subclasses: Record<string, [Subclass, Subclass]> = {
  knight: [
    {
      id: 'crusader',
      classId: 'knight',
      nameKey: 'subclass_crusader',
      descKey: 'subclass_crusader_desc',
      apply: (p) => {
        p.atkMult = round2(p.atkMult + 0.12);
      },
      params: { spellSmite: 2.5 },
    },
    {
      id: 'warden',
      classId: 'knight',
      nameKey: 'subclass_warden',
      descKey: 'subclass_warden_desc',
      apply: (p) => {
        p.defense += 3;
        p.maxHP += 15;
        p.hp = Math.min(p.maxHP, p.hp + 15);
      },
      params: { guardCharges: 2 },
    },
  ],
  mage: [
    {
      id: 'pyromancer',
      classId: 'mage',
      nameKey: 'subclass_pyromancer',
      descKey: 'subclass_pyromancer_desc',
      apply: (p) => {
        p.comboBonus = round2(p.comboBonus + 0.2);
      },
      params: { spellPower: 1.6 },
    },
    {
      id: 'chronomancer',
      classId: 'mage',
      nameKey: 'subclass_chronomancer',
      descKey: 'subclass_chronomancer_desc',
      apply: (p) => {
        p.timeFactor = round2(p.timeFactor + 0.1);
      },
      params: { overloadEvery: 3 },
    },
  ],
  rogue: [
    {
      id: 'assassin',
      classId: 'rogue',
      nameKey: 'subclass_assassin',
      descKey: 'subclass_assassin_desc',
      apply: (p) => {
        p.critMult = Math.min(4, round2(p.critMult + 0.5));
      },
      params: { spellPower: 1.4 },
    },
    {
      id: 'nightblade',
      classId: 'rogue',
      nameKey: 'subclass_nightblade',
      descKey: 'subclass_nightblade_desc',
      apply: (p) => {
        p.critChance = Math.min(0.8, round2(p.critChance + 0.12));
      },
      params: { ambushStrikes: 2 },
    },
  ],
  templar: [
    {
      id: 'inquisitor',
      classId: 'templar',
      nameKey: 'subclass_inquisitor',
      descKey: 'subclass_inquisitor_desc',
      apply: (p) => {
        p.atkMult = round2(p.atkMult + 0.1);
      },
      params: { spellPower: 1.5 },
    },
    {
      id: 'guardian',
      classId: 'templar',
      nameKey: 'subclass_guardian',
      descKey: 'subclass_guardian_desc',
      apply: (p) => {
        p.maxHP += 20;
        p.hp = Math.min(p.maxHP, p.hp + 20);
        p.defense += 2;
      },
      params: { consecrationHeal: 26 },
    },
  ],
  berserker: [
    {
      id: 'warlord',
      classId: 'berserker',
      nameKey: 'subclass_warlord',
      descKey: 'subclass_warlord_desc',
      apply: (p) => {
        p.atkMult = round2(p.atkMult + 0.12);
      },
      params: { spellPower: 1.5 },
    },
    {
      id: 'reaver',
      classId: 'berserker',
      nameKey: 'subclass_reaver',
      descKey: 'subclass_reaver_desc',
      apply: (p) => {
        p.lifesteal = Math.min(0.6, round2(p.lifesteal + 0.15));
      },
      params: { bloodlustScale: 0.9 },
    },
  ],
};

export function subclassesFor(classId: string): [Subclass, Subclass] {
  const pair = subclasses[classId];
  if (!pair) throw new Error(`No subclasses for class: ${classId}`);
  return pair;
}

export function findSubclass(id: string): Subclass {
  for (const pair of Object.values(subclasses)) {
    const s = pair.find((x) => x.id === id);
    if (s) return s;
  }
  throw new Error(`Unknown subclass: ${id}`);
}

// Fold a chosen subclass's parameter overrides over the base values. With no
// subclass (not yet ascended) the hero plays with the base parameters.
export function evoParamsFor(subclassId?: string): EvoParams {
  if (!subclassId) return { ...BASE_EVO };
  return { ...BASE_EVO, ...findSubclass(subclassId).params };
}
