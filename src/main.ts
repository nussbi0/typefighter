import './style.css';
import {
  getLocale,
  setLocale,
  onLocaleChange,
  renderTextWithDropCap,
  t,
  type Locale,
} from './i18n';
import { mountFight } from './fight';
import { mountEncounter } from './encounter';
import { mountLevelUp } from './levelup';
import { mountRunOver } from './runover';
import { mountBranch } from './branch';
import { mountClassSelect } from './classselect';
import { mountModeSelect, type ModeChoice } from './modeselect';
import { mountCustomSeed } from './customseed';
import { mountResumePrompt } from './resumeprompt';
import { clearRun, loadRun, saveRun, type RunPhase, type SavedRun } from './runstore';
import type { HeroClass } from './classes';
import {
  advance,
  applyModifier,
  applyPending,
  isRunComplete,
  newRun,
  type RunMode,
  type RunState,
} from './state';
import {
  bestEndless,
  bestRun,
  bestWPM,
  recordEndlessEnd,
  recordFightOutcome,
  recentDailies,
  recordRunEnd,
  recordRunStart,
  recordSeedResult,
  totals,
  type FightOutcome,
  type SeedResult,
} from './stats';
import { endlessCandidates, enemiesByTier, findEnemy, RUN_LENGTH, type Enemy } from './enemies';
import { initAudioPrefs, isMuted, setMuted, sfxType } from './audio';
import { dailySeed, randomSeed, streamFor } from './rng';

function applyStaticI18n() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n!;
    const text = t(key);
    if (el.classList.contains('with-drop-cap')) {
      renderTextWithDropCap(el, text);
    } else {
      el.textContent = text;
    }
  });
  document.title = t('title');
}

function bindLangSwitcher() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.lang-switcher button');
  const sync = () => {
    const current = getLocale();
    buttons.forEach((b) => {
      const active = b.dataset.locale === current;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  };
  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      setLocale(b.dataset.locale as Locale);
    });
  });
  onLocaleChange(sync);
  sync();
}

function renderStatsModal() {
  const content = document.getElementById('stats-content')!;
  const tot = totals();
  content.innerHTML = `
    <div class="annals-section">
      <h3 class="annals-section-title" data-i18n="stat_longest_run"></h3>
      <div class="annals-row"><span class="annals-key">EN</span><span class="annals-val">${bestRun('en')} / ${RUN_LENGTH}</span></div>
      <div class="annals-row"><span class="annals-key">DE</span><span class="annals-val">${bestRun('de')} / ${RUN_LENGTH}</span></div>
    </div>
    <div class="annals-section">
      <h3 class="annals-section-title" data-i18n="stat_best_depth"></h3>
      <div class="annals-row"><span class="annals-key">EN</span><span class="annals-val">${bestEndless('en')}</span></div>
      <div class="annals-row"><span class="annals-key">DE</span><span class="annals-val">${bestEndless('de')}</span></div>
    </div>
    <div class="annals-section">
      <h3 class="annals-section-title" data-i18n="stat_record_wpm"></h3>
      <div class="annals-row"><span class="annals-key">EN</span><span class="annals-val">${t('stat_wpm_unit', { wpm: bestWPM('en') })}</span></div>
      <div class="annals-row"><span class="annals-key">DE</span><span class="annals-val">${t('stat_wpm_unit', { wpm: bestWPM('de') })}</span></div>
    </div>
    <div class="annals-section annals-section-full">
      <h3 class="annals-section-title" data-i18n="stat_runs_total"></h3>
      <div class="annals-row annals-row-solo"><span class="annals-val">${tot.runs} (${tot.clears})</span></div>
    </div>
    ${renderDailyAnnals()}
  `;
  content.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
}

function renderDailyAnnals(): string {
  const dailies = recentDailies(5);
  if (dailies.length === 0) return '';
  const rows = dailies
    .map(
      ({ date, result }) =>
        `<div class="annals-row"><span class="annals-key">${date}</span><span class="annals-val">${t('annals_daily_row', { depth: result.depth, wpm: result.bestWPM })}</span></div>`,
    )
    .join('');
  return `
    <div class="annals-section annals-section-full">
      <h3 class="annals-section-title" data-i18n="annals_daily_title"></h3>
      ${rows}
    </div>
  `;
}

function bindStatsModal() {
  const btn = document.getElementById('stats-button')!;
  const dlg = document.getElementById('stats-modal') as HTMLDialogElement;
  const card = dlg.querySelector('.modal-card') as HTMLElement;
  const closeBtn = dlg.querySelector('.modal-close') as HTMLButtonElement;
  btn.addEventListener('click', () => {
    renderStatsModal();
    dlg.showModal();
  });
  closeBtn.addEventListener('click', () => dlg.close());
  card.addEventListener('click', (e) => e.stopPropagation());
  dlg.addEventListener('click', () => dlg.close());
  onLocaleChange(() => {
    if (dlg.open) renderStatsModal();
  });
}

const INTRO_KEY = 'typefighter.seenIntro.v1';

function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, '1');
  } catch {
    // ignore
  }
}

function bindHowToModal() {
  const btn = document.getElementById('howto-button')!;
  const dlg = document.getElementById('howto-modal') as HTMLDialogElement;
  const card = dlg.querySelector('.modal-card') as HTMLElement;
  const closeBtn = dlg.querySelector('.howto-close') as HTMLButtonElement;
  btn.addEventListener('click', () => dlg.showModal());
  closeBtn.addEventListener('click', () => dlg.close());
  card.addEventListener('click', (e) => e.stopPropagation());
  dlg.addEventListener('click', () => dlg.close());
}

function bindSoundToggle() {
  const btn = document.getElementById('sound-button')!;
  const sync = () => {
    btn.textContent = t(isMuted() ? 'sound_off' : 'sound_on');
    btn.setAttribute('aria-pressed', String(!isMuted()));
  };
  btn.addEventListener('click', () => {
    setMuted(!isMuted());
    if (!isMuted()) sfxType(); // confirmation blip when (re)enabling
    sync();
  });
  onLocaleChange(sync);
  sync();
}

function spawnEmbers(count: number) {
  const layer = document.createElement('div');
  layer.className = 'embers';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const e = document.createElement('span');
    e.className = 'ember';
    const size = 2 + Math.random() * 4;
    e.style.left = `${Math.random() * 100}%`;
    e.style.width = `${size}px`;
    e.style.height = `${size}px`;
    e.style.setProperty('--sway', `${(Math.random() - 0.5) * 120}px`);
    e.style.setProperty('--dur', `${14 + Math.random() * 14}s`);
    e.style.animationDelay = `${-Math.random() * 24}s`;
    layer.appendChild(e);
  }
  document.body.prepend(layer);
}

initAudioPrefs();
onLocaleChange(applyStaticI18n);
applyStaticI18n();
bindLangSwitcher();
bindStatsModal();
bindHowToModal();
bindSoundToggle();
spawnEmbers(20);

const scene = document.getElementById('scene')!;
let cleanupScene: (() => void) | null = null;
let runBestWPM = 0;
let runAgg = { correct: 0, mistakes: 0, elapsedMs: 0 };

function show(mount: (host: HTMLElement) => () => void) {
  if (cleanupScene) cleanupScene();
  scene.innerHTML = '';
  cleanupScene = mount(scene);
}

function startRun() {
  show((host) => mountModeSelect(host, { onPick: onModeChoice }));
}

function onModeChoice(choice: ModeChoice) {
  if (choice === 'custom') {
    show((host) =>
      mountCustomSeed(host, { onStart: (seed) => chooseClass('endless', seed, false) }),
    );
  } else if (choice === 'daily') {
    chooseClass('endless', dailySeed(new Date()), true);
  } else {
    chooseClass(choice, randomSeed(), false);
  }
}

function chooseClass(mode: RunMode, seed: string = randomSeed(), daily = false) {
  show((host) => mountClassSelect(host, { onPick: (hero) => beginRun(hero, mode, seed, daily) }));
}

function beginRun(heroClass: HeroClass, mode: RunMode, seed: string, daily: boolean) {
  runBestWPM = 0;
  runAgg = { correct: 0, mistakes: 0, elapsedMs: 0 };
  recordRunStart();
  const run = newRun(heroClass, mode, seed, daily);
  showEncounter(run);
}

function tallyOutcome(outcome: FightOutcome) {
  runBestWPM = Math.max(runBestWPM, outcome.wpm);
  runAgg.correct += outcome.correctChars;
  runAgg.mistakes += outcome.mistakes;
  runAgg.elapsedMs += outcome.elapsedMs;
}

function persist(run: RunState, phase: RunPhase) {
  saveRun({ phase, run, runBestWPM });
}

function showEncounter(run: RunState) {
  const applied = applyPending(run);
  persist(run, 'encounter');
  show((host) =>
    mountEncounter(host, {
      enemy: run.upcomingEnemy,
      player: run.player,
      playerSprite: run.heroClass.sprite,
      encounterNumber: run.fightNumber,
      endless: run.mode === 'endless',
      seed: run.seed,
      daily: run.daily,
      appliedHeal: applied.healed,
      appliedMaxHP: applied.maxBoosted,
      onStart: () => showFight(run),
    }),
  );
}

function wordLevelFor(run: RunState): number {
  // Endless scales word difficulty with depth; Classic uses the foe's tier.
  return run.mode === 'endless'
    ? 1 + Math.floor((run.fightNumber - 1) / 2)
    : run.upcomingEnemy.tier;
}

function showFight(run: RunState) {
  show((host) =>
    mountFight(host, {
      enemy: run.upcomingEnemy,
      player: run.player,
      playerSprite: run.heroClass.sprite,
      wordLevel: wordLevelFor(run),
      passive: run.heroClass.passive,
      wordRng: streamFor(run.seed, 'words', run.fightNumber),
      onWin: (remainingHP, outcome) => {
        tallyOutcome(outcome);
        recordFightOutcome(outcome, getLocale());
        run.player.hp = remainingHP;
        advance(run);
        afterFightWin(run);
      },
      onLose: (outcome) => {
        tallyOutcome(outcome);
        recordFightOutcome(outcome, getLocale());
        showRunOver(run, 'lost');
      },
    }),
  );
}

function afterFightWin(run: RunState) {
  if (isRunComplete(run)) {
    showRunOver(run, 'won');
    return;
  }
  showLevelUp(run);
}

function showLevelUp(run: RunState) {
  persist(run, 'levelup');
  show((host) =>
    mountLevelUp(host, {
      player: run.player,
      favoredBoons: run.heroClass.favoredBoons,
      seed: run.seed,
      depth: run.fightNumber,
      onChosen: () => afterLevelUp(run),
    }),
  );
}

function afterLevelUp(run: RunState) {
  const nextFightNumber = run.fightNumber + 1;
  if (run.mode === 'classic' && nextFightNumber === RUN_LENGTH) {
    // Final fight: dragon, fixed
    run.fightNumber = nextFightNumber;
    run.upcomingEnemy = findEnemy('dragon');
    showEncounter(run);
    return;
  }
  enterBranch(run);
}

function enterBranch(run: RunState) {
  const nextFightNumber = run.fightNumber + 1;
  const candidates =
    run.mode === 'endless'
      ? endlessCandidates(nextFightNumber, streamFor(run.seed, 'foes', nextFightNumber))
      : enemiesByTier(nextFightNumber);
  persist(run, 'branch');
  showBranch(run, nextFightNumber, candidates);
}

function showBranch(run: RunState, nextFightNumber: number, candidates: Enemy[]) {
  show((host) =>
    mountBranch(host, {
      enemies: candidates,
      player: run.player,
      rng: streamFor(run.seed, 'branch', nextFightNumber),
      onPicked: (enemy, modifier) => {
        run.fightNumber = nextFightNumber;
        run.upcomingEnemy = enemy;
        applyModifier(run, modifier);
        showEncounter(run);
      },
    }),
  );
}

function showRunOver(run: RunState, result: 'won' | 'lost') {
  clearRun();
  const locale = getLocale();
  const prevBestRun = bestRun(locale);
  const prevBestWPM = bestWPM(locale);
  const prevBestEndless = bestEndless(locale);
  if (run.mode === 'endless') {
    recordEndlessEnd(run.defeated, locale);
  } else {
    recordRunEnd(run.defeated, result === 'won', locale);
  }
  const newRunRecord = run.mode === 'classic' && run.defeated > prevBestRun;
  const newWPMRecord = runBestWPM > prevBestWPM;
  const newEndlessRecord = run.mode === 'endless' && run.defeated > prevBestEndless;

  const keystrokes = runAgg.correct + runAgg.mistakes;
  const minutes = runAgg.elapsedMs / 60000;
  const seedResult: SeedResult = {
    depth: run.defeated,
    bestWPM: runBestWPM,
    avgWPM: minutes > 0 ? Math.round(runAgg.correct / 5 / minutes) : 0,
    accuracy: keystrokes > 0 ? runAgg.correct / keystrokes : 1,
    durationMs: runAgg.elapsedMs,
    classId: run.heroClass.id,
  };
  const newSeedRecord = recordSeedResult(run.seed, seedResult);

  show((host) =>
    mountRunOver(host, {
      run,
      result,
      runBestWPM,
      newRunRecord,
      newWPMRecord,
      newEndlessRecord,
      seedResult,
      newSeedRecord,
      onRestart: startRun,
    }),
  );
}

function resumeRun(saved: SavedRun) {
  runBestWPM = saved.runBestWPM;
  const { run } = saved;
  // Backfill fields added after older saves were written.
  if (!run.seed) run.seed = randomSeed();
  run.daily = run.daily ?? false;
  if (saved.phase === 'levelup') showLevelUp(run);
  else if (saved.phase === 'branch') enterBranch(run);
  else showEncounter(run);
}

function showResumePrompt(saved: SavedRun) {
  show((host) =>
    mountResumePrompt(host, {
      run: saved.run,
      onResume: () => resumeRun(saved),
      onNew: () => {
        clearRun();
        startRun();
      },
    }),
  );
}

function readSharedSeed(): { seed: string; daily: boolean } | null {
  const params = new URLSearchParams(location.search);
  const daily = params.has('daily');
  const seed = params.get('seed');
  if (!daily && !seed) return null;
  // Clean the URL so a reload doesn't keep forcing the shared run.
  history.replaceState(null, '', location.pathname);
  return { seed: daily ? dailySeed(new Date()) : seed!, daily };
}

const shared = readSharedSeed();
const savedRun = loadRun();
if (shared) {
  chooseClass('endless', shared.seed, shared.daily);
} else if (savedRun) {
  showResumePrompt(savedRun);
} else {
  startRun();
}

if (!hasSeenIntro()) {
  (document.getElementById('howto-modal') as HTMLDialogElement).showModal();
  markIntroSeen();
}
