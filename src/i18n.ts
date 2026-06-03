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
    enemy_bat: 'Cave Bat',
    enemy_wolf: 'Wolf',
    enemy_skeleton: 'Skeleton',
    enemy_spider: 'Giant Spider',
    enemy_orc: 'Orc',
    enemy_troll: 'Troll',
    enemy_boar: 'Dire Boar',
    enemy_sorcerer: 'Sorcerer',
    enemy_ghost: 'Wraith',
    enemy_golem: 'Stone Golem',
    enemy_vampire: 'Vampire',
    enemy_dragon: 'Dragon',
    enemy_demon: 'Demon Lord',
    enemy_kraken: 'Kraken',

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
    upgrade_execution: 'Execution',
    upgrade_execution_desc: 'Critical strikes deal +0.5× damage.',
    upgrade_sentinel: 'Sentinel',
    upgrade_sentinel_desc: '+3 defense and +15 max HP.',

    levelup_reroll: 'Reroll ({n})',
    boon_favored: 'Favored',
    stat_def: 'Def',
    stat_crit: 'Crit',
    stat_critdmg: 'Crit dmg',
    stat_lifesteal: 'Lifesteal',
    stat_combo: 'Combo',
    stat_focus: 'Focus',
    stat_regen: 'Regen',

    encounter_title: 'Encounter {n} of {total}',
    encounter_depth: 'Depth {n}',
    encounter_boss: 'A grim foe blocks your path.',
    encounter_appears: 'A wild {enemy} approaches.',
    encounter_begin: 'Begin combat',

    resume_title: 'Continue your run?',
    resume_continue: 'Resume',
    resume_new: 'New run',

    mode_title: 'Choose your trial',
    mode_subtitle: 'How far will your typing carry you?',
    mode_classic: 'Classic',
    mode_classic_desc: 'A focused gauntlet of {total} foes, ending with a boss.',
    mode_endless: 'Endless',
    mode_endless_desc: 'Fight ever-tougher foes until you fall. How deep can you go?',
    mode_daily: 'Daily',
    mode_daily_desc:
      "Today's seeded gauntlet — the same run for everyone. One shared challenge a day.",
    mode_custom: 'Custom Seed',
    mode_custom_desc: 'Enter or share a seed to replay an exact run.',

    custom_title: 'Custom seed',
    custom_subtitle: 'Enter a seed — the same seed always plays the same run.',
    custom_placeholder: 'Type a seed (or leave blank for random)',
    custom_start: 'Start run',

    seed_label: 'Seed: {seed}',
    seed_daily: 'Daily · {seed}',
    seed_share: 'Share',
    seed_copied: 'Copied!',

    stat_hp: 'HP',
    stat_atk: 'ATK',
    stat_level: 'Level',
    stat_speed: 'Speed',
    stat_damage: 'Damage',

    levelup_title: 'Triumph! Claim a boon.',

    runover_won: 'Victorious',
    runover_lost: 'You have fallen',
    runover_endless_over: 'Overwhelmed',
    runover_count: '{n} of {total} foes vanquished',
    runover_depth: 'Reached depth {n}',
    runover_restart: 'Begin a new run',

    tier_perfect: 'Perfect!',
    tier_great: 'Great!',
    enraged: 'Enraged!',

    stat_best_fight: 'Best fight',
    stat_record_wpm: 'Record WPM',
    stat_longest_run: 'Longest run',
    stat_best_depth: 'Deepest run',
    stat_runs_total: 'Runs (cleared)',
    stat_new_record: 'New!',
    stat_wpm_unit: '{wpm} WPM',

    stats_button: 'Annals',
    stats_title: 'Annals',
    stats_close: 'Close',

    sound_on: '🔊 Sound',
    sound_off: '🔇 Muted',

    howto_button: 'Guide',
    howto_tagline: 'A typing-fueled RPG duel.',
    howto_premise:
      'Battle five foes as a hero of your choosing. Type each incoming word before it reaches you — the sooner you finish, the harder you strike.',
    howto_p1: 'Type the word racing toward you before it lands a hit.',
    howto_p2: 'Finish early for Perfect or Great strikes — more damage.',
    howto_p3: 'Multi-word combos hit hard, but hurt more if they reach you.',
    howto_p4: 'Win a fight to claim a boon — pick with 1/2/3, reroll once with R.',
    howto_p5: 'Switch EN/DE and review your records (Annals) up top.',
    howto_p6: 'Pick Classic (a set gauntlet) or Endless (survive as deep as you can).',
    howto_begin: 'Enter the fray',

    classselect_title: 'Choose your hero',
    classselect_subtitle: 'Each path favors a different way to fight.',
    class_knight: 'Knight',
    class_knight_desc: 'Hardened veteran — more health and innate armor.',
    class_mage: 'Mage',
    class_mage_desc: 'Frail but devastating — combos strike far harder.',
    class_rogue: 'Rogue',
    class_rogue_desc: "A duelist's eye — innate critical chance.",
    class_templar: 'Templar',
    class_templar_desc: 'Holy endurance — steady regen and stout health.',
    class_berserker: 'Berserker',
    class_berserker_desc: 'Reckless fury — hits hard but frail.',

    passive_knight: 'Guard — halves the first hit each fight.',
    passive_mage: 'Overload — every 4th strike deals double.',
    passive_rogue: 'Ambush — your opening strike always crits.',
    passive_templar: "Consecration — heal 12 HP at each fight's start.",
    passive_berserker: 'Bloodlust — more damage the lower your HP.',
    passive_guard: 'Guard',

    ability_armor: 'Armor {n}',
    ability_regen: 'Regen {n}',
    ability_lifesteal: 'Lifesteal',
    ability_poison: 'Poison',
    ability_armor_tip: 'Armor — blunts the damage you deal.',
    ability_regen_tip: 'Regen — the foe heals between its attacks.',
    ability_lifesteal_tip: 'Lifesteal — the foe heals when it strikes you.',
    ability_poison_tip: 'Poison — its hits leave venom that wounds you over time.',
    howto_abilities_title: 'Foes & their tricks',

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
    enemy_bat: 'Höhlenfledermaus',
    enemy_wolf: 'Wolf',
    enemy_skeleton: 'Skelett',
    enemy_spider: 'Riesenspinne',
    enemy_orc: 'Ork',
    enemy_troll: 'Troll',
    enemy_boar: 'Wildeber',
    enemy_sorcerer: 'Zauberer',
    enemy_ghost: 'Geist',
    enemy_golem: 'Steingolem',
    enemy_vampire: 'Vampir',
    enemy_dragon: 'Drache',
    enemy_demon: 'Dämonenfürst',
    enemy_kraken: 'Krake',

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
    upgrade_execution: 'Hinrichtung',
    upgrade_execution_desc: 'Kritische Treffer verursachen +0,5× Schaden.',
    upgrade_sentinel: 'Wächter',
    upgrade_sentinel_desc: '+3 Verteidigung und +15 max LP.',

    levelup_reroll: 'Neu mischen ({n})',
    boon_favored: 'Bevorzugt',
    stat_def: 'Vert',
    stat_crit: 'Krit',
    stat_critdmg: 'Kritschaden',
    stat_lifesteal: 'Lebensraub',
    stat_combo: 'Kombo',
    stat_focus: 'Fokus',
    stat_regen: 'Regen',

    encounter_title: 'Begegnung {n} von {total}',
    encounter_depth: 'Tiefe {n}',
    encounter_boss: 'Ein finsterer Feind versperrt deinen Weg.',
    encounter_appears: 'Ein wilder {enemy} naht.',
    encounter_begin: 'Kampf beginnen',

    resume_title: 'Lauf fortsetzen?',
    resume_continue: 'Fortsetzen',
    resume_new: 'Neuer Lauf',

    mode_title: 'Wähle deine Prüfung',
    mode_subtitle: 'Wie weit trägt dich dein Tippen?',
    mode_classic: 'Klassisch',
    mode_classic_desc: 'Ein straffer Parcours aus {total} Gegnern mit Boss zum Schluss.',
    mode_endless: 'Endlos',
    mode_endless_desc: 'Kämpfe gegen immer stärkere Gegner, bis du fällst. Wie tief kommst du?',
    mode_daily: 'Täglich',
    mode_daily_desc:
      'Der gesäte Parcours des Tages — für alle derselbe Lauf. Eine geteilte Tagesprüfung.',
    mode_custom: 'Eigener Code',
    mode_custom_desc: 'Gib einen Seed-Code ein oder teile ihn, um einen Lauf exakt zu wiederholen.',

    custom_title: 'Eigener Seed',
    custom_subtitle: 'Gib einen Seed ein — derselbe Seed spielt stets denselben Lauf.',
    custom_placeholder: 'Seed eingeben (oder leer für zufällig)',
    custom_start: 'Lauf starten',

    seed_label: 'Seed: {seed}',
    seed_daily: 'Täglich · {seed}',
    seed_share: 'Teilen',
    seed_copied: 'Kopiert!',

    stat_hp: 'LP',
    stat_atk: 'ANG',
    stat_level: 'Stufe',
    stat_speed: 'Tempo',
    stat_damage: 'Schaden',

    levelup_title: 'Triumph! Wähle eine Gabe.',

    runover_won: 'Siegreich',
    runover_lost: 'Du bist gefallen',
    runover_endless_over: 'Überwältigt',
    runover_count: '{n} von {total} Gegnern besiegt',
    runover_depth: 'Tiefe {n} erreicht',
    runover_restart: 'Neuen Lauf beginnen',

    tier_perfect: 'Perfekt!',
    tier_great: 'Stark!',
    enraged: 'Wütend!',

    stat_best_fight: 'Bester Kampf',
    stat_record_wpm: 'Rekord WPM',
    stat_longest_run: 'Längster Lauf',
    stat_best_depth: 'Tiefster Lauf',
    stat_runs_total: 'Läufe (bezwungen)',
    stat_new_record: 'Neu!',
    stat_wpm_unit: '{wpm} WPM',

    stats_button: 'Chronik',
    stats_title: 'Chronik',
    stats_close: 'Schließen',

    sound_on: '🔊 Ton',
    sound_off: '🔇 Stumm',

    howto_button: 'Anleitung',
    howto_tagline: 'Ein tippgetriebenes RPG-Duell.',
    howto_premise:
      'Bekämpfe fünf Gegner als Held deiner Wahl. Tippe jedes ankommende Wort, bevor es dich erreicht — je früher du fertig bist, desto härter triffst du.',
    howto_p1: 'Tippe das heranrasende Wort, bevor es einschlägt.',
    howto_p2: 'Früh fertig werden für Perfekt- oder Stark-Treffer — mehr Schaden.',
    howto_p3: 'Mehrwort-Kombos treffen hart, schmerzen aber mehr, wenn sie dich erreichen.',
    howto_p4: 'Gewinne einen Kampf für eine Gabe — wähle mit 1/2/3, einmal neu mischen mit R.',
    howto_p5: 'Wechsle EN/DE und sieh deine Rekorde (Chronik) oben ein.',
    howto_p6: 'Wähle Klassisch (fester Parcours) oder Endlos (so tief wie möglich überleben).',
    howto_begin: 'In den Kampf',

    classselect_title: 'Wähle deinen Helden',
    classselect_subtitle: 'Jeder Pfad begünstigt einen anderen Kampfstil.',
    class_knight: 'Ritter',
    class_knight_desc: 'Abgehärteter Veteran — mehr Leben und Rüstung.',
    class_mage: 'Magier',
    class_mage_desc: 'Zerbrechlich, doch verheerend — Kombos treffen härter.',
    class_rogue: 'Schurke',
    class_rogue_desc: 'Das Auge des Duellanten — angeborene Kritchance.',
    class_templar: 'Templer',
    class_templar_desc: 'Heilige Ausdauer — stetige Regeneration und robuste LP.',
    class_berserker: 'Berserker',
    class_berserker_desc: 'Rücksichtslose Wut — trifft hart, doch zerbrechlich.',

    passive_knight: 'Schutz — halbiert den ersten Treffer pro Kampf.',
    passive_mage: 'Überladung — jeder 4. Schlag trifft doppelt.',
    passive_rogue: 'Hinterhalt — dein erster Schlag trifft immer kritisch.',
    passive_templar: 'Weihe — heile 12 LP zu Kampfbeginn.',
    passive_berserker: 'Blutrausch — mehr Schaden, je weniger LP.',
    passive_guard: 'Schutz',

    ability_armor: 'Rüstung {n}',
    ability_regen: 'Regen {n}',
    ability_lifesteal: 'Lebensraub',
    ability_poison: 'Gift',
    ability_armor_tip: 'Rüstung — mindert den Schaden, den du verursachst.',
    ability_regen_tip: 'Regen — der Gegner heilt sich zwischen seinen Angriffen.',
    ability_lifesteal_tip: 'Lebensraub — der Gegner heilt sich, wenn er dich trifft.',
    ability_poison_tip: 'Gift — seine Treffer verletzen dich über Zeit weiter.',
    howto_abilities_title: 'Gegner & ihre Tücken',

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

export function renderTextWithDropCap(el: HTMLElement, text: string): void {
  el.textContent = '';
  if (!text) return;
  const cap = document.createElement('span');
  cap.className = 'drop-cap';
  cap.textContent = text[0];
  el.append(cap, document.createTextNode(text.slice(1)));
}
