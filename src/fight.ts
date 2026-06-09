import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { randomWord, rollWordKind, type WordKind } from './words';
import { unseededRng, type Rng } from './rng';
import { sfxEnrage, sfxHurt, sfxLose, sfxStrike, sfxType, sfxTypo, sfxWin } from './audio';
import { announce } from './a11y';
import type { Enemy } from './enemies';
import type { PlayerStats } from './state';
import type { FightOutcome } from './stats';

const BASE_DAMAGE = 22;
const MIN_DURATION_MS = 1500;

const TIER_PERFECT_MAX = 0.32;
const TIER_GREAT_MAX = 0.62;

export type Tier = 'perfect' | 'great' | 'good';

const TIER_MULT: Record<Tier, number> = {
  perfect: 1.5,
  great: 1.2,
  good: 1.0,
};

const ATTACK_COMBO_MULT: Record<number, number> = { 1: 1.0, 2: 1.6, 3: 2.2 };
const PLAYER_DMG_COMBO_MULT: Record<number, number> = { 1: 1.0, 2: 1.4, 3: 1.7 };

export interface FightProps {
  enemy: Enemy;
  player: PlayerStats;
  playerSprite: string;
  wordLevel: number;
  passive?: string;
  wordRng?: Rng;
  onWin: (remainingHP: number, outcome: FightOutcome) => void;
  onLose: (outcome: FightOutcome) => void;
}

type Status = 'fighting' | 'won' | 'lost';

interface State {
  playerHP: number;
  enemyHP: number;
  word: string | null;
  wordCount: number;
  typed: string;
  wordSpawnedAt: number;
  wordDuration: number;
  status: Status;
}

export function mountFight(host: HTMLElement, props: FightProps): () => void {
  const {
    enemy,
    player,
    playerSprite,
    wordLevel,
    passive,
    wordRng = unseededRng,
    onWin,
    onLose,
  } = props;

  host.innerHTML = `
    <div class="fight">
      <div class="combatants">
        <div class="combatant enemy">
          <span class="corner corner-tl"></span>
          <span class="corner corner-tr"></span>
          <span class="corner corner-bl"></span>
          <span class="corner corner-br"></span>
          <div class="avatar enemy-avatar">${enemy.sprite}</div>
          <div class="meta">
            <div class="name with-drop-cap" data-i18n="${enemy.nameKey}"></div>
            <div class="hp-bar"><div class="hp-fill enemy-hp"></div></div>
            <div class="hp-text enemy-hp-text"></div>
          </div>
        </div>
        <div class="vs" aria-label="versus">⚔</div>
        <div class="combatant player">
          <span class="corner corner-tl"></span>
          <span class="corner corner-tr"></span>
          <span class="corner corner-bl"></span>
          <span class="corner corner-br"></span>
          <div class="meta">
            <div class="name with-drop-cap" data-i18n="you"></div>
            <div class="hp-bar"><div class="hp-fill player-hp"></div></div>
            <div class="hp-text player-hp-text"></div>
          </div>
          <div class="avatar player-avatar">${playerSprite}</div>
        </div>
      </div>

      <div class="track" aria-hidden="true">
        <span class="corner corner-tl"></span>
        <span class="corner corner-tr"></span>
        <span class="corner corner-bl"></span>
        <span class="corner corner-br"></span>
        <div class="track-rail"></div>
        <div class="hit-zone"></div>
        <div class="word">
          <span class="typed"></span><span class="cursor"></span><span class="rest"></span>
        </div>
        <div class="floater"></div>
      </div>

      <div class="banner"></div>
      <p class="hint" data-i18n="hint"></p>
    </div>
  `;

  const root = host.querySelector('.fight') as HTMLElement;
  const els = {
    word: root.querySelector('.word') as HTMLElement,
    typed: root.querySelector('.word .typed') as HTMLElement,
    cursor: root.querySelector('.word .cursor') as HTMLElement,
    rest: root.querySelector('.word .rest') as HTMLElement,
    track: root.querySelector('.track') as HTMLElement,
    playerHP: root.querySelector('.player-hp') as HTMLElement,
    enemyHP: root.querySelector('.enemy-hp') as HTMLElement,
    playerHPText: root.querySelector('.player-hp-text') as HTMLElement,
    enemyHPText: root.querySelector('.enemy-hp-text') as HTMLElement,
    floater: root.querySelector('.floater') as HTMLElement,
    banner: root.querySelector('.banner') as HTMLElement,
    enemyCombatant: root.querySelector('.combatant.enemy') as HTMLElement,
    enemyAvatar: root.querySelector('.enemy-avatar') as HTMLElement,
    playerAvatar: root.querySelector('.player-avatar') as HTMLElement,
  };

  const state: State = {
    playerHP: player.hp,
    enemyHP: enemy.maxHP,
    word: null,
    wordCount: 1,
    typed: '',
    wordSpawnedAt: 0,
    wordDuration: 0,
    status: 'fighting',
  };

  let currentMsPerChar = enemy.msPerChar;
  let currentSpawnDelay = enemy.spawnDelayMs;
  let currentComboChance = enemy.comboChance;
  let phaseTriggered = false;

  let spawnTimer: number | null = null;
  let rafHandle: number | null = null;
  let resolved = false;

  let firstSpawnAt = 0;
  let correctChars = 0;
  let mistakes = 0;
  let lastWord: string | undefined; // avoid spawning the same word twice in a row
  let wordKind: WordKind = 'normal'; // the current spawn's special kind
  let shield = false; // a Ward word grants a shield that absorbs the next hit

  // Enemy status effects + per-class passive bookkeeping
  let poisonStacks = 0;
  let lastPoisonTick = 0;
  let firstStrike = true; // rogue Ambush
  let guardUsed = false; // knight Guard
  let wordsCompleted = 0; // mage Overload counter

  const POISON_INTERVAL_MS = 1000;

  function applyI18n() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n!);
      if (el.classList.contains('with-drop-cap')) {
        renderTextWithDropCap(el, text);
      } else {
        el.textContent = text;
      }
    });
  }

  const offLocale = onLocaleChange(() => {
    applyI18n();
    if (state.status === 'won' || state.status === 'lost') {
      renderTextWithDropCap(els.banner, state.status === 'won' ? t('victory') : t('defeat'));
    } else if (state.word) {
      cancelSpawn();
      state.word = null;
      state.typed = '';
      state.wordCount = 1;
      wordKind = 'normal';
      els.word.classList.remove('active', 'combo', 'kind-flame', 'kind-ward', 'kind-cursed');
      renderWord();
      scheduleSpawn(180);
    }
  });

  function cancelSpawn() {
    if (spawnTimer != null) {
      clearTimeout(spawnTimer);
      spawnTimer = null;
    }
  }

  function scheduleSpawn(delay = currentSpawnDelay) {
    cancelSpawn();
    spawnTimer = window.setTimeout(spawnWord, delay);
  }

  function rollWordCount(): number {
    if (Math.random() >= currentComboChance) return 1;
    if (enemy.comboMaxWords <= 2) return 2;
    return Math.random() < 0.5 ? 2 : 3;
  }

  function spawnWord() {
    if (state.status !== 'fighting') return;
    // Troll/Kraken — regeneration between attacks
    if (enemy.regen && state.enemyHP > 0 && state.enemyHP < enemy.maxHP) {
      state.enemyHP = Math.min(enemy.maxHP, state.enemyHP + enemy.regen);
      showFloat('heal heal-enemy', `+${enemy.regen}`);
      renderHP();
    }
    const wordCount = rollWordCount();
    // Specials apply only to single-word spawns, and never the opening word.
    const isFirstSpawn = firstSpawnAt === 0;
    wordKind = wordCount === 1 && !isFirstSpawn ? rollWordKind(wordRng) : 'normal';
    const parts: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      // Avoid the previous spawn's last word and any word already in this combo,
      // so no word repeats next to itself or elsewhere in the same phrase.
      const avoid = lastWord != null ? [lastWord, ...parts] : parts;
      const w = randomWord(wordLevel, wordRng, avoid);
      parts.push(w);
      lastWord = w;
    }
    const phrase = parts.join(' ');
    state.word = phrase;
    state.wordCount = wordCount;
    state.typed = '';
    state.wordSpawnedAt = performance.now();
    state.wordDuration = Math.max(
      MIN_DURATION_MS,
      phrase.length * currentMsPerChar * player.timeFactor,
    );
    if (firstSpawnAt === 0) firstSpawnAt = state.wordSpawnedAt;
    renderWord();
    clearWordKindClass();
    els.word.classList.add('active');
    els.word.classList.toggle('combo', wordCount > 1);
    if (wordKind !== 'normal') els.word.classList.add(`kind-${wordKind}`);
    els.enemyAvatar.classList.remove('cast');
    void els.enemyAvatar.offsetWidth;
    els.enemyAvatar.classList.add('cast');
  }

  function renderWord() {
    if (!state.word) {
      els.typed.textContent = '';
      els.cursor.textContent = '';
      els.rest.textContent = '';
      return;
    }
    const w = state.word;
    const i = state.typed.length;
    els.typed.textContent = w.slice(0, i);
    els.cursor.textContent = w[i] ?? '';
    els.rest.textContent = w.slice(i + 1);
  }

  function renderHP() {
    const playerPct = (state.playerHP / player.maxHP) * 100;
    const enemyPct = (state.enemyHP / enemy.maxHP) * 100;
    els.playerHP.style.width = `${playerPct}%`;
    els.enemyHP.style.width = `${enemyPct}%`;
    const ratio = Math.max(0, Math.min(1, state.playerHP / player.maxHP));
    els.playerHP.style.setProperty('--hp-hue', (ratio * 105).toString());
    els.playerHPText.textContent = `${state.playerHP} / ${player.maxHP}`;
    els.enemyHPText.textContent = `${state.enemyHP} / ${enemy.maxHP}`;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (state.status !== 'fighting' || !state.word) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Backspace') {
      if (state.typed.length > 0) {
        state.typed = state.typed.slice(0, -1);
        renderWord();
      }
      e.preventDefault();
      return;
    }

    if (e.key.length !== 1) return;
    const expected = state.word[state.typed.length];
    if (!expected) return;

    const expectedLower = expected.toLowerCase();
    const keyLower = e.key.toLowerCase();
    if (keyLower === expectedLower) {
      state.typed += expected;
      correctChars += 1;
      sfxType();
      renderWord();
      if (state.typed.length === state.word.length) {
        resolveCompletion();
      }
    } else {
      mistakes += 1;
      sfxTypo();
      flashTypo();
    }
  }

  function classifyTier(progress: number): Tier {
    if (progress < TIER_PERFECT_MAX) return 'perfect';
    if (progress < TIER_GREAT_MAX) return 'great';
    return 'good';
  }

  function resolveCompletion() {
    // Cursed word — typing it backfires on you instead of striking the foe.
    if (wordKind === 'cursed') {
      resolveCursed();
      return;
    }
    const elapsed = performance.now() - state.wordSpawnedAt;
    const progress = elapsed / state.wordDuration;
    const tier = classifyTier(progress);
    let comboMult = ATTACK_COMBO_MULT[state.wordCount] ?? 1;
    if (state.wordCount > 1) comboMult += player.comboBonus;
    let dmg = BASE_DAMAGE * TIER_MULT[tier] * comboMult * player.atkMult;

    // Berserker — Bloodlust: harder you bleed, harder you hit
    if (passive === 'bloodlust') {
      const missing = 1 - state.playerHP / player.maxHP;
      dmg *= 1 + missing * 0.5;
    }
    // Mage — Overload: every fourth strike detonates for double
    wordsCompleted += 1;
    const overload = passive === 'overload' && wordsCompleted % 4 === 0;
    if (overload) dmg *= 2;
    // Flame word — an enchanted strike for bonus damage
    if (wordKind === 'flame') dmg *= 1.5;

    dmg = Math.round(dmg);

    // Rogue — Ambush: the opening strike of a fight always crits
    let crit = Math.random() < player.critChance;
    if (passive === 'ambush' && firstStrike) crit = true;
    firstStrike = false;
    if (crit) dmg = Math.round(dmg * player.critMult);

    // Golem etc — armor blunts the blow
    if (enemy.armor) dmg = Math.max(1, dmg - enemy.armor);

    const wasCombo = state.wordCount > 1;
    state.enemyHP = Math.max(0, state.enemyHP - dmg);
    sfxStrike(tier, crit);
    showHit('enemy', dmg, tier, crit);
    hitFlash(els.enemyAvatar);
    applyHeal(Math.round(dmg * player.lifesteal) + player.regen);
    if (crit || overload) {
      spawnBurst(els.enemyAvatar, 'spark', 9);
      shake();
    } else if (wasCombo) {
      spawnBurst(els.enemyAvatar, 'spark', 5);
    }
    if (wordKind === 'flame') spawnBurst(els.enemyAvatar, 'ember', 8);
    if (wordKind === 'ward') {
      shield = true;
      updateShield();
      showFloat('ward', t('ward_gained'));
    }
    state.word = null;
    state.typed = '';
    state.wordCount = 1;
    els.word.classList.remove('active', 'combo');
    clearWordKindClass();
    renderWord();
    renderHP();
    checkPhaseChange();
    if (state.enemyHP === 0) {
      spawnBurst(els.enemyAvatar, 'spark', 16);
      els.enemyAvatar.classList.remove('enraged', 'cast');
      els.enemyAvatar.classList.add('defeated');
      shake();
      endFight('won');
    } else {
      scheduleSpawn();
    }
  }

  function resolveCursed() {
    const dmg = Math.max(1, Math.round(enemy.hitDamage * 0.7));
    state.playerHP = Math.max(0, state.playerHP - dmg);
    sfxHurt();
    showHit('player', dmg);
    showFloat('curse', t('curse_label'));
    hitFlash(els.playerAvatar);
    spawnBurst(els.playerAvatar, 'ember', 7);
    shake();
    state.word = null;
    state.typed = '';
    state.wordCount = 1;
    els.word.classList.remove('active', 'combo');
    clearWordKindClass();
    renderWord();
    renderHP();
    if (state.playerHP === 0) {
      endFight('lost');
    } else {
      scheduleSpawn();
    }
  }

  function applyHeal(amount: number) {
    if (amount <= 0) return;
    const before = state.playerHP;
    state.playerHP = Math.min(player.maxHP, state.playerHP + amount);
    const applied = state.playerHP - before;
    if (applied > 0) showHeal(applied);
  }

  function showFloat(className: string, text: string) {
    const node = document.createElement('div');
    node.className = className;
    node.textContent = text;
    els.floater.appendChild(node);
    setTimeout(() => node.remove(), 1000);
  }

  function clearWordKindClass() {
    els.word.classList.remove('kind-flame', 'kind-ward', 'kind-cursed');
  }

  function updateShield() {
    els.playerAvatar.classList.toggle('shielded', shield);
  }

  function loop() {
    const now = performance.now();
    if (state.status === 'fighting' && state.word) {
      const progress = Math.min(1, (now - state.wordSpawnedAt) / state.wordDuration);
      positionWord(progress);

      if (progress >= 1) {
        enemyHits();
      }
    }
    if (
      state.status === 'fighting' &&
      poisonStacks > 0 &&
      now - lastPoisonTick >= POISON_INTERVAL_MS
    ) {
      lastPoisonTick = now;
      const tick = poisonStacks;
      state.playerHP = Math.max(0, state.playerHP - tick);
      showFloat('poison', `-${tick} ☠`);
      poisonStacks -= 1;
      renderHP();
      if (state.playerHP === 0) endFight('lost');
    }
    rafHandle = requestAnimationFrame(loop);
  }

  function positionWord(progress: number) {
    const trackW = els.track.clientWidth;
    const wordW = els.word.clientWidth;
    const maxOffset = Math.max(0, trackW - wordW - 28);
    const x = -maxOffset * progress;
    els.word.style.transform = `translate(${x}px, -50%)`;
  }

  function clearReachedWord() {
    state.word = null;
    state.typed = '';
    state.wordCount = 1;
    els.word.classList.remove('active', 'combo');
    clearWordKindClass();
    renderWord();
  }

  function enemyHits() {
    // A cursed word you correctly let pass does no harm.
    if (wordKind === 'cursed') {
      showFloat('dodge', t('curse_dodged'));
      clearReachedWord();
      scheduleSpawn();
      return;
    }
    // A Ward shield absorbs this blow entirely (and its on-hit effects).
    if (shield) {
      shield = false;
      updateShield();
      showFloat('ward', t('ward_block'));
      hitFlash(els.playerAvatar);
      clearReachedWord();
      renderHP();
      scheduleSpawn();
      return;
    }
    const dmgMult = PLAYER_DMG_COMBO_MULT[state.wordCount] ?? 1;
    const raw = Math.round(enemy.hitDamage * dmgMult);
    let dmg = Math.max(1, raw - player.defense);
    // Knight — Guard: the first blow of each fight is halved
    if (passive === 'guard' && !guardUsed) {
      dmg = Math.max(1, Math.ceil(dmg / 2));
      guardUsed = true;
      showFloat('guard', t('passive_guard'));
    }
    state.playerHP = Math.max(0, state.playerHP - dmg);
    sfxHurt();
    showHit('player', dmg);
    hitFlash(els.playerAvatar);
    spawnBurst(els.playerAvatar, 'ember', 7);
    shake();
    // Vampire — lifesteal: the foe drinks from the wound
    if (enemy.lifesteal) {
      const healed = Math.round(dmg * enemy.lifesteal);
      if (healed > 0) {
        state.enemyHP = Math.min(enemy.maxHP, state.enemyHP + healed);
        showFloat('heal heal-enemy', `+${healed}`);
      }
    }
    // Spider/Wraith — poison: lingering damage over time
    if (enemy.poison) {
      if (poisonStacks === 0) lastPoisonTick = performance.now();
      poisonStacks += enemy.poison;
    }
    state.word = null;
    state.typed = '';
    state.wordCount = 1;
    els.word.classList.remove('active', 'combo');
    clearWordKindClass();
    renderWord();
    renderHP();
    if (state.playerHP === 0) {
      endFight('lost');
    } else {
      scheduleSpawn();
    }
  }

  function showHit(who: 'player' | 'enemy', dmg: number, tier?: Tier, crit = false) {
    const node = document.createElement('div');
    node.className = `damage damage-${who}`;
    if (tier && tier !== 'good') node.classList.add(`tier-${tier}`);
    if (crit) node.classList.add('crit');
    const tierLabel =
      tier === 'perfect' ? t('tier_perfect') : tier === 'great' ? t('tier_great') : '';
    const amountText = crit ? `-${dmg} ✦` : `-${dmg}`;
    if (tierLabel) {
      const label = document.createElement('span');
      label.className = 'tier-label';
      label.textContent = tierLabel;
      const amount = document.createElement('span');
      amount.className = 'tier-amount';
      amount.textContent = amountText;
      node.append(label, amount);
    } else {
      node.textContent = amountText;
    }
    els.floater.appendChild(node);
    setTimeout(() => node.remove(), 1000);
  }

  function showHeal(amount: number) {
    const node = document.createElement('div');
    node.className = 'heal heal-player';
    node.textContent = `+${amount}`;
    els.floater.appendChild(node);
    setTimeout(() => node.remove(), 1000);
  }

  function hitFlash(el: HTMLElement) {
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }

  function shake() {
    host.classList.remove('shaking');
    void host.offsetWidth;
    host.classList.add('shaking');
    window.setTimeout(() => host.classList.remove('shaking'), 260);
  }

  function spawnBurst(el: HTMLElement, kind: 'spark' | 'ember', count: number) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = `particle particle-${kind}`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 38;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--delay', `${Math.floor(Math.random() * 70)}ms`);
      el.appendChild(p);
      window.setTimeout(() => p.remove(), 760);
    }
  }

  function flashTypo() {
    els.word.classList.remove('typo');
    void els.word.offsetWidth;
    els.word.classList.add('typo');
  }

  function checkPhaseChange() {
    if (phaseTriggered || !enemy.phaseChange) return;
    const ratio = state.enemyHP / enemy.maxHP;
    if (ratio > enemy.phaseChange.triggerHPRatio) return;
    phaseTriggered = true;
    sfxEnrage();
    announce(`${t(enemy.nameKey)} — ${t('enraged')}`);
    currentMsPerChar = enemy.phaseChange.msPerChar;
    currentSpawnDelay = enemy.phaseChange.spawnDelayMs;
    currentComboChance = enemy.phaseChange.comboChance;
    els.enemyAvatar.classList.add('enraged');
    const banner = document.createElement('div');
    banner.className = 'phase-banner';
    banner.textContent = t('enraged');
    els.enemyCombatant.appendChild(banner);
    setTimeout(() => banner.remove(), 1600);
  }

  function computeOutcome(): FightOutcome {
    const elapsedMs = firstSpawnAt ? performance.now() - firstSpawnAt : 0;
    const minutes = elapsedMs / 60000;
    const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;
    return { wpm, correctChars, mistakes, elapsedMs };
  }

  function endFight(result: 'won' | 'lost') {
    if (resolved) return;
    state.status = result;
    if (result === 'won') sfxWin();
    else sfxLose();
    announce(result === 'won' ? t('victory') : t('defeat'));
    els.word.classList.remove('active', 'combo');
    clearWordKindClass();
    renderTextWithDropCap(els.banner, result === 'won' ? t('victory') : t('defeat'));
    els.banner.dataset.state = result;
    els.banner.classList.add('show');
    resolved = true;
    cancelSpawn();
    const outcome = computeOutcome();
    window.setTimeout(() => {
      if (result === 'won') onWin(state.playerHP, outcome);
      else onLose(outcome);
    }, 1400);
  }

  // Templar — Consecration: enter each fight with renewed vigor
  if (passive === 'consecration') applyHeal(12);

  applyI18n();
  renderHP();
  announce(
    `${t(enemy.nameKey)} — ${t('you')} ${state.playerHP}/${player.maxHP}, ${t(enemy.nameKey)} ${state.enemyHP}/${enemy.maxHP}`,
  );
  document.addEventListener('keydown', onKeyDown);
  scheduleSpawn(500);
  loop();

  return () => {
    cancelSpawn();
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    document.removeEventListener('keydown', onKeyDown);
    offLocale();
  };
}
