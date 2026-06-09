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
