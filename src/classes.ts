import type { PlayerStats } from './state';

export interface HeroClass {
  id: string;
  nameKey: string;
  descKey: string;
  sprite: string;
  stats: Partial<PlayerStats>;
  favoredBoons: string[];
}

export const classes: HeroClass[] = [
  {
    id: 'knight',
    nameKey: 'class_knight',
    descKey: 'class_knight_desc',
    sprite: '🛡️',
    stats: { maxHP: 125, defense: 3 },
    favoredBoons: ['bulwark', 'vigor', 'mend', 'renewal'],
  },
  {
    id: 'mage',
    nameKey: 'class_mage',
    descKey: 'class_mage_desc',
    sprite: '🪄',
    stats: { maxHP: 80, comboBonus: 0.3 },
    favoredBoons: ['frenzy', 'focus', 'might', 'precision'],
  },
  {
    id: 'rogue',
    nameKey: 'class_rogue',
    descKey: 'class_rogue_desc',
    sprite: '🗡️',
    stats: { maxHP: 95, critChance: 0.18 },
    favoredBoons: ['precision', 'might', 'bloodthirst', 'frenzy'],
  },
];

export function findClass(id: string): HeroClass {
  const c = classes.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown class: ${id}`);
  return c;
}
