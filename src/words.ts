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
export type WordKind = 'normal' | 'flame' | 'ward' | 'cursed' | 'spell';

const FLAME_CHANCE = 0.1;
const WARD_CHANCE = 0.08;
const CURSED_CHANCE = 0.08;
const SPELL_CHANCE = 0.06;

export function rollWordKind(rng: Rng = unseededRng): WordKind {
  const r = rng.next();
  if (r < FLAME_CHANCE) return 'flame';
  if (r < FLAME_CHANCE + WARD_CHANCE) return 'ward';
  if (r < FLAME_CHANCE + WARD_CHANCE + CURSED_CHANCE) return 'cursed';
  if (r < FLAME_CHANCE + WARD_CHANCE + CURSED_CHANCE + SPELL_CHANCE) return 'spell';
  return 'normal';
}

// Boss-only full sentences, themed per boss. Lowercase, letters and spaces
// only, capped around 43 characters so the phrase box fits the track.
// prettier-ignore
const bossPhrases: Record<Locale, Record<string, string[]>> = {
  en: {
    dragon: [
      'ancient wings blot out the pale sun',
      'fire older than the mountains awakens',
      'scales of iron shrug off mortal steel',
      'the hoard glitters beneath burning wings',
      'a roar splits the vault of heaven',
      'cinder and ash rain upon the keep',
      'golden eyes weigh your fleeting courage',
      'the wyrm coils around its molten throne',
    ],
    demon: [
      'the abyss whispers your true name',
      'chains of brimstone drag souls below',
      'every sin you buried walks again',
      'hellfire dances upon obsidian horns',
      'the legion kneels before its dark lord',
      'despair is the coin of this dominion',
      'shadows feast upon your faltering hope',
      'the pit hungers and will be fed',
    ],
    kraken: [
      'tentacles rise from the drowning deep',
      'the tide obeys a will older than ships',
      'salt and ruin follow in its wake',
      'a thousand sailors sleep in its garden',
      'the abyss stares back with lidless eyes',
      'crushing depths swallow the proudest fleet',
      'ink black waters churn beneath the hull',
      'the leviathan of the trench stirs',
    ],
  },
  de: {
    dragon: [
      'uralte schwingen verdunkeln den himmel',
      'feuer älter als die berge erwacht',
      'schuppen aus eisen trotzen jedem stahl',
      'ein brüllen zerreisst das himmelszelt',
      'asche und glut regnen auf die festung',
      'goldene augen wägen deinen mut',
      'der wurm umschlingt seinen glühenden hort',
      'sein odem verwandelt knochen zu asche',
    ],
    demon: [
      'der abgrund flüstert deinen wahren namen',
      'ketten aus schwefel ziehen seelen hinab',
      'jede begrabene sünde wandelt erneut',
      'höllenfeuer tanzt auf obsidianhörnern',
      'die legion kniet vor dem dunklen fürsten',
      'verzweiflung ist die münze dieses reichs',
      'schatten laben sich an deiner hoffnung',
      'die grube hungert und will gefüttert sein',
    ],
    kraken: [
      'tentakel steigen aus ertrunkener tiefe',
      'die flut gehorcht einem uralten willen',
      'salz und verderben folgen seinem sog',
      'tausend seeleute schlafen in seinem garten',
      'der abgrund starrt mit lidlosen augen',
      'schwarze wasser brodeln unter dem kiel',
      'die tiefe verschlingt die stolzeste flotte',
      'das ungetüm des grabens erwacht',
    ],
  },
};

// A boss hurls a themed sentence instead of a word combo. Drawn from the
// seeded word stream so daily runs face the same lines. Depth-scaled bosses
// carry ids like "dragon@10" — the base id selects the pool.
export function bossPhrase(bossId: string, rng: Rng = unseededRng, avoid?: string): string {
  const pool = bossPhrases[getLocale()][bossId.split('@')[0]];
  if (!pool) {
    // Unknown boss — fall back to a plain three-word volley.
    const parts: string[] = [];
    for (let i = 0; i < 3; i++) parts.push(randomWord(5, rng, parts));
    return parts.join(' ');
  }
  let phrase = pool[0];
  for (let attempt = 0; attempt < 8; attempt++) {
    phrase = pool[rng.int(pool.length)];
    if (phrase !== avoid) break;
  }
  return phrase;
}

// Jumble a word's letters for the Scramble affliction — the scrambled string
// becomes the typing target, so the player types exactly what they see. Drawn
// from live dice (not the seeded word stream): afflictions depend on getting
// hit, and consuming seeded draws here would desync daily word sequences.
export function scrambleWord(word: string, rng: Rng = unseededRng): string {
  for (let attempt = 0; attempt < 6; attempt++) {
    const out = rng.shuffle([...word]).join('');
    if (out !== word) return out;
  }
  return word;
}

export function randomWord(
  level = 1,
  rng: Rng = unseededRng,
  avoid?: string | readonly string[],
): string {
  const list = bands[getLocale()];
  const maxBand = list.length - 1;
  const hi = Math.min(maxBand, Math.max(0, level - 1));
  const lo = Math.max(0, hi - 2);
  const avoidSet =
    avoid == null ? null : typeof avoid === 'string' ? new Set([avoid]) : new Set(avoid);
  // Redraw a few times to skip any avoided word — repeats within or across a
  // combo read oddly. The pools are large, so this rarely loops.
  let word = '';
  for (let attempt = 0; attempt < 8; attempt++) {
    const band = lo + rng.int(hi - lo + 1);
    const pool = list[band];
    word = pool[rng.int(pool.length)];
    if (!avoidSet || !avoidSet.has(word)) break;
  }
  return word;
}
