import { getLocale, type Locale } from './i18n';
import { unseededRng, type Rng } from './rng';

// Words grouped into difficulty bands (index 0 = shortest/easiest, higher =
// longer/rarer). The fight requests a word at a difficulty level derived from
// the foe's tier (Classic) or endless depth, so combat gets harder to *type*,
// not just tankier.
// prettier-ignore
const bands: Record<Locale, string[][]> = {
  en: [
    // band 0 — 3-4 letters
    ['axe', 'bow', 'hex', 'orc', 'foe', 'vow', 'ash', 'fang', 'claw', 'iron', 'gold', 'fire', 'bane', 'rune', 'dusk', 'moss'],
    // band 1 — 5 letters
    ['blade', 'sword', 'armor', 'flame', 'frost', 'spark', 'storm', 'light', 'magic', 'spell', 'slash', 'parry', 'charm', 'ember', 'crypt', 'ghoul'],
    // band 2 — 6-7 letters
    ['shield', 'dagger', 'hammer', 'shadow', 'dragon', 'goblin', 'wizard', 'attack', 'defend', 'strike', 'potion', 'castle', 'knight', 'rapier', 'plague', 'cinder'],
    // band 3 — 8-9 letters
    ['crossbow', 'gauntlet', 'sorcerer', 'banshee', 'talisman', 'scabbard', 'paladin', 'ironclad', 'moonlit', 'sapphire', 'conjurer', 'gargoyle', 'warhammer', 'vanguard'],
    // band 4 — 10+ letters / rarer
    ['broadsword', 'battleaxe', 'enchanter', 'necromancer', 'bloodthirst', 'incantation', 'chronicle', 'fortitude', 'labyrinth', 'apparition', 'executioner', 'leviathan'],
  ],
  de: [
    ['axt', 'erz', 'ork', 'gold', 'mut', 'sieg', 'rune', 'zorn', 'pfeil', 'klaue', 'asche', 'feind'],
    ['feuer', 'eisen', 'magie', 'sturm', 'licht', 'fluch', 'trank', 'hexer', 'klinge', 'panzer', 'glanz', 'parade'],
    ['schwert', 'schild', 'zauber', 'drache', 'goblin', 'ritter', 'angriff', 'schmiede', 'schatten', 'festung', 'rüstung', 'dolch'],
    ['armbrust', 'zauberer', 'talisman', 'paladin', 'schildwall', 'donnerhall', 'blutdurst', 'gargoyle', 'kettenhemd', 'mondlicht'],
    ['kriegshammer', 'beschwörer', 'nekromant', 'festungstor', 'ungeheuer', 'henkersbeil', 'labyrinth', 'erscheinung', 'standhaftig', 'verhängnis'],
  ],
};

// Pick a word for the given difficulty level (1-based). The level selects a
// window of bands [lo, hi]; as it climbs, the shortest bands drop out and the
// longest become reachable. Levels beyond the last band stay clamped at the top.
// Special word kinds. Drawn from the (seeded) word stream so a daily seed
// presents the same enchanted/cursed words to everyone.
export type WordKind = 'normal' | 'flame' | 'ward' | 'cursed';

const FLAME_CHANCE = 0.1;
const WARD_CHANCE = 0.08;
const CURSED_CHANCE = 0.08;

export function rollWordKind(rng: Rng = unseededRng): WordKind {
  const r = rng.next();
  if (r < FLAME_CHANCE) return 'flame';
  if (r < FLAME_CHANCE + WARD_CHANCE) return 'ward';
  if (r < FLAME_CHANCE + WARD_CHANCE + CURSED_CHANCE) return 'cursed';
  return 'normal';
}

export function randomWord(level = 1, rng: Rng = unseededRng, avoid?: string): string {
  const list = bands[getLocale()];
  const maxBand = list.length - 1;
  const hi = Math.min(maxBand, Math.max(0, level - 1));
  const lo = Math.max(0, hi - 2);
  // Redraw a few times to avoid repeating the previous word — two identical
  // words in a row read oddly. The pools are large, so this rarely loops.
  let word = '';
  for (let attempt = 0; attempt < 8; attempt++) {
    const band = lo + rng.int(hi - lo + 1);
    const pool = list[band];
    word = pool[rng.int(pool.length)];
    if (word !== avoid) break;
  }
  return word;
}
