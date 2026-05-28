export type Locale = 'en' | 'de';
export const locales: Locale[] = ['en', 'de'];

type Messages = Record<string, string>;
type Params = Record<string, string | number>;

const messages: Record<Locale, Messages> = {
  en: {
    title: 'Type Fighter',
    you: 'Hero',
    victory: 'Victory!',
    defeat: 'Defeated',
    retry: 'Fight again',
    hint: 'Type the incoming word before it reaches you. Faster = more damage.',

    enemy_goblin: 'Goblin',
    enemy_wolf: 'Wolf',
    enemy_skeleton: 'Skeleton',
    enemy_orc: 'Orc',
    enemy_troll: 'Troll',
    enemy_sorcerer: 'Sorcerer',
    enemy_ghost: 'Wraith',
    enemy_dragon: 'Dragon',

    upgrade_might: 'Might',
    upgrade_might_desc: 'Your strikes land 20% harder.',
    upgrade_vigor: 'Vigor',
    upgrade_vigor_desc: '+25 max HP and recover 25 HP.',
    upgrade_mend: 'Mend',
    upgrade_mend_desc: 'Restore your wounds to full.',
    upgrade_bulwark: 'Bulwark',
    upgrade_bulwark_desc: 'Reduce damage taken by 4.',
    upgrade_precision: 'Precision',
    upgrade_precision_desc: '+20% chance to strike for double.',
    upgrade_bloodthirst: 'Bloodthirst',
    upgrade_bloodthirst_desc: 'Heal 15% of the damage you deal.',
    upgrade_frenzy: 'Frenzy',
    upgrade_frenzy_desc: 'Combos deal +40% damage.',
    upgrade_focus: 'Focus',
    upgrade_focus_desc: 'Words approach 12% slower.',
    upgrade_renewal: 'Renewal',
    upgrade_renewal_desc: 'Recover 2 HP per word typed.',

    levelup_reroll: 'Reroll ({n})',
    boon_favored: 'Favored',
    stat_def: 'Def',
    stat_crit: 'Crit',
    stat_lifesteal: 'Lifesteal',
    stat_combo: 'Combo',
    stat_focus: 'Focus',
    stat_regen: 'Regen',

    encounter_title: 'Encounter {n} of {total}',
    encounter_boss: 'A grim foe blocks your path.',
    encounter_appears: 'A wild {enemy} approaches.',
    encounter_begin: 'Begin combat',

    stat_hp: 'HP',
    stat_atk: 'ATK',
    stat_level: 'Level',
    stat_speed: 'Speed',
    stat_damage: 'Damage',

    levelup_title: 'Triumph! Claim a boon.',

    runover_won: 'Victorious',
    runover_lost: 'You have fallen',
    runover_count: '{n} of {total} foes vanquished',
    runover_restart: 'Begin a new run',

    tier_perfect: 'Perfect!',
    tier_great: 'Great!',
    enraged: 'Enraged!',

    stat_best_fight: 'Best fight',
    stat_record_wpm: 'Record WPM',
    stat_longest_run: 'Longest run',
    stat_runs_total: 'Runs (cleared)',
    stat_new_record: 'New!',
    stat_wpm_unit: '{wpm} WPM',

    stats_button: 'Annals',
    stats_title: 'Annals',
    stats_close: 'Close',

    howto_button: 'Guide',
    howto_tagline: 'A typing-fueled RPG duel.',
    howto_premise: 'Battle five foes as a hero of your choosing. Type each incoming word before it reaches you — the sooner you finish, the harder you strike.',
    howto_p1: 'Type the word racing toward you before it lands a hit.',
    howto_p2: 'Finish early for Perfect or Great strikes — more damage.',
    howto_p3: 'Multi-word combos hit hard, but hurt more if they reach you.',
    howto_p4: 'Win a fight to claim a boon — pick with 1/2/3, reroll once with R.',
    howto_p5: 'Switch EN/DE and review your records (Annals) up top.',
    howto_begin: 'Enter the fray',

    classselect_title: 'Choose your hero',
    classselect_subtitle: 'Each path favors a different way to fight.',
    class_knight: 'Knight',
    class_knight_desc: 'Hardened veteran — more health and innate armor.',
    class_mage: 'Mage',
    class_mage_desc: 'Frail but devastating — combos strike far harder.',
    class_rogue: 'Rogue',
    class_rogue_desc: "A duelist's eye — innate critical chance.",

    branch_title: 'A crossroads',
    branch_subtitle: 'Two foes lie ahead — choose your trial.',
    modifier_refuge: 'Refuge',
    modifier_refuge_desc: '+25 HP before the fight',
    modifier_empower: 'Empower',
    modifier_empower_desc: '+15 max HP, +15 HP',
    encounter_healed: 'Restored +{n} HP',
    encounter_max_boost: '+{n} max HP',
  },
  de: {
    title: 'Type Fighter',
    you: 'Held',
    victory: 'Sieg!',
    defeat: 'Besiegt',
    retry: 'Nochmal kämpfen',
    hint: 'Tippe das ankommende Wort, bevor es dich erreicht. Schneller = mehr Schaden.',

    enemy_goblin: 'Goblin',
    enemy_wolf: 'Wolf',
    enemy_skeleton: 'Skelett',
    enemy_orc: 'Ork',
    enemy_troll: 'Troll',
    enemy_sorcerer: 'Zauberer',
    enemy_ghost: 'Geist',
    enemy_dragon: 'Drache',

    upgrade_might: 'Stärke',
    upgrade_might_desc: 'Deine Hiebe treffen 20% härter.',
    upgrade_vigor: 'Lebenskraft',
    upgrade_vigor_desc: '+25 max LP und 25 LP geheilt.',
    upgrade_mend: 'Heilung',
    upgrade_mend_desc: 'Schliesse alle Wunden.',
    upgrade_bulwark: 'Bollwerk',
    upgrade_bulwark_desc: 'Verringert erlittenen Schaden um 4.',
    upgrade_precision: 'Präzision',
    upgrade_precision_desc: '+20% Chance auf doppelten Schaden.',
    upgrade_bloodthirst: 'Blutdurst',
    upgrade_bloodthirst_desc: 'Heile 15% des verursachten Schadens.',
    upgrade_frenzy: 'Raserei',
    upgrade_frenzy_desc: 'Kombos verursachen +40% Schaden.',
    upgrade_focus: 'Fokus',
    upgrade_focus_desc: 'Wörter nahen 12% langsamer.',
    upgrade_renewal: 'Erneuerung',
    upgrade_renewal_desc: 'Heile 2 LP pro getipptem Wort.',

    levelup_reroll: 'Neu mischen ({n})',
    boon_favored: 'Bevorzugt',
    stat_def: 'Vert',
    stat_crit: 'Krit',
    stat_lifesteal: 'Lebensraub',
    stat_combo: 'Kombo',
    stat_focus: 'Fokus',
    stat_regen: 'Regen',

    encounter_title: 'Begegnung {n} von {total}',
    encounter_boss: 'Ein finsterer Feind versperrt deinen Weg.',
    encounter_appears: 'Ein wilder {enemy} naht.',
    encounter_begin: 'Kampf beginnen',

    stat_hp: 'LP',
    stat_atk: 'ANG',
    stat_level: 'Stufe',
    stat_speed: 'Tempo',
    stat_damage: 'Schaden',

    levelup_title: 'Triumph! Wähle eine Gabe.',

    runover_won: 'Siegreich',
    runover_lost: 'Du bist gefallen',
    runover_count: '{n} von {total} Gegnern besiegt',
    runover_restart: 'Neuen Lauf beginnen',

    tier_perfect: 'Perfekt!',
    tier_great: 'Stark!',
    enraged: 'Wütend!',

    stat_best_fight: 'Bester Kampf',
    stat_record_wpm: 'Rekord WPM',
    stat_longest_run: 'Längster Lauf',
    stat_runs_total: 'Läufe (bezwungen)',
    stat_new_record: 'Neu!',
    stat_wpm_unit: '{wpm} WPM',

    stats_button: 'Chronik',
    stats_title: 'Chronik',
    stats_close: 'Schließen',

    howto_button: 'Anleitung',
    howto_tagline: 'Ein tippgetriebenes RPG-Duell.',
    howto_premise: 'Bekämpfe fünf Gegner als Held deiner Wahl. Tippe jedes ankommende Wort, bevor es dich erreicht — je früher du fertig bist, desto härter triffst du.',
    howto_p1: 'Tippe das heranrasende Wort, bevor es einschlägt.',
    howto_p2: 'Früh fertig werden für Perfekt- oder Stark-Treffer — mehr Schaden.',
    howto_p3: 'Mehrwort-Kombos treffen hart, schmerzen aber mehr, wenn sie dich erreichen.',
    howto_p4: 'Gewinne einen Kampf für eine Gabe — wähle mit 1/2/3, einmal neu mischen mit R.',
    howto_p5: 'Wechsle EN/DE und sieh deine Rekorde (Chronik) oben ein.',
    howto_begin: 'In den Kampf',

    classselect_title: 'Wähle deinen Helden',
    classselect_subtitle: 'Jeder Pfad begünstigt einen anderen Kampfstil.',
    class_knight: 'Ritter',
    class_knight_desc: 'Abgehärteter Veteran — mehr Leben und Rüstung.',
    class_mage: 'Magier',
    class_mage_desc: 'Zerbrechlich, doch verheerend — Kombos treffen härter.',
    class_rogue: 'Schurke',
    class_rogue_desc: 'Das Auge des Duellanten — angeborene Kritchance.',

    branch_title: 'Eine Wegkreuzung',
    branch_subtitle: 'Zwei Feinde stehen bereit — wähle deine Prüfung.',
    modifier_refuge: 'Zuflucht',
    modifier_refuge_desc: '+25 LP vor dem Kampf',
    modifier_empower: 'Stärkung',
    modifier_empower_desc: '+15 max LP, +15 LP',
    encounter_healed: '+{n} LP wiederhergestellt',
    encounter_max_boost: '+{n} max LP',
  },
};

const words: Record<Locale, string[]> = {
  en: [
    'sword', 'shield', 'arrow', 'flame', 'frost', 'spark', 'blade', 'armor',
    'storm', 'light', 'shadow', 'magic', 'spell', 'potion', 'wizard', 'dragon',
    'quest', 'attack', 'defend', 'strike', 'parry', 'dodge', 'focus', 'breath',
    'iron', 'steel', 'silver', 'golden', 'quick', 'strong', 'swift', 'brave',
    'hero', 'goblin', 'dungeon', 'tower', 'castle', 'forest', 'river', 'mountain',
    'gleam', 'crash', 'smash', 'rage', 'calm', 'steady', 'sharp', 'ember',
  ],
  de: [
    'schwert', 'schild', 'pfeil', 'flamme', 'frost', 'funke', 'klinge', 'panzer',
    'sturm', 'licht', 'schatten', 'magie', 'zauber', 'trank', 'hexer', 'drache',
    'quest', 'angriff', 'schutz', 'schlag', 'parade', 'ausweichen', 'fokus', 'atem',
    'eisen', 'stahl', 'silber', 'golden', 'schnell', 'stark', 'flink', 'tapfer',
    'held', 'goblin', 'höhle', 'turm', 'burg', 'wald', 'fluss', 'berg',
    'glanz', 'krach', 'wut', 'ruhe', 'scharf', 'glut', 'mut', 'ehre',
  ],
};

const LOCALE_STORAGE_KEY = 'typefighter.locale.v1';

function loadInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (locales as string[]).includes(saved)) return saved as Locale;
  } catch {
    // localStorage unavailable
  }
  return 'en';
}

let current: Locale = loadInitialLocale();
document.documentElement.lang = current;

const listeners: (() => void)[] = [];

export function getLocale(): Locale {
  return current;
}

export function setLocale(loc: Locale): void {
  if (!locales.includes(loc) || loc === current) return;
  current = loc;
  document.documentElement.lang = loc;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, loc);
  } catch {
    // ignore quota / unavailable
  }
  listeners.forEach((l) => l());
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function t(key: string, params?: Params): string {
  let str = messages[current][key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

export function randomWord(): string {
  const list = words[current];
  return list[Math.floor(Math.random() * list.length)];
}

export function renderTextWithDropCap(el: HTMLElement, text: string): void {
  el.textContent = '';
  if (!text) return;
  const cap = document.createElement('span');
  cap.className = 'drop-cap';
  cap.textContent = text[0];
  el.append(cap, document.createTextNode(text.slice(1)));
}
