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
import type { HeroClass } from './classes';
import {
  advance,
  applyModifier,
  applyPending,
  isRunComplete,
  newRun,
  type RunState,
} from './state';
import {
  bestRun,
  bestWPM,
  recordFightOutcome,
  recordRunEnd,
  recordRunStart,
  totals,
} from './stats';
import { findEnemy, RUN_LENGTH } from './enemies';

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
      b.classList.toggle('active', b.dataset.locale === current);
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
      <h3 class="annals-section-title" data-i18n="stat_record_wpm"></h3>
      <div class="annals-row"><span class="annals-key">EN</span><span class="annals-val">${t('stat_wpm_unit', { wpm: bestWPM('en') })}</span></div>
      <div class="annals-row"><span class="annals-key">DE</span><span class="annals-val">${t('stat_wpm_unit', { wpm: bestWPM('de') })}</span></div>
    </div>
    <div class="annals-section annals-section-full">
      <h3 class="annals-section-title" data-i18n="stat_runs_total"></h3>
      <div class="annals-row annals-row-solo"><span class="annals-val">${tot.runs} (${tot.clears})</span></div>
    </div>
  `;
  content.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
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

onLocaleChange(applyStaticI18n);
applyStaticI18n();
bindLangSwitcher();
bindStatsModal();

const scene = document.getElementById('scene')!;
let cleanupScene: (() => void) | null = null;
let runBestWPM = 0;

function show(mount: (host: HTMLElement) => () => void) {
  if (cleanupScene) cleanupScene();
  scene.innerHTML = '';
  cleanupScene = mount(scene);
}

function startRun() {
  show((host) => mountClassSelect(host, { onPick: beginRun }));
}

function beginRun(heroClass: HeroClass) {
  runBestWPM = 0;
  recordRunStart();
  const run = newRun(heroClass);
  showEncounter(run);
}

function showEncounter(run: RunState) {
  const applied = applyPending(run);
  show((host) =>
    mountEncounter(host, {
      enemy: run.upcomingEnemy,
      player: run.player,
      playerSprite: run.heroClass.sprite,
      encounterNumber: run.fightNumber,
      appliedHeal: applied.healed,
      appliedMaxHP: applied.maxBoosted,
      onStart: () => showFight(run),
    })
  );
}

function showFight(run: RunState) {
  show((host) =>
    mountFight(host, {
      enemy: run.upcomingEnemy,
      player: run.player,
      playerSprite: run.heroClass.sprite,
      onWin: (remainingHP, outcome) => {
        runBestWPM = Math.max(runBestWPM, outcome.wpm);
        recordFightOutcome(outcome, getLocale());
        run.player.hp = remainingHP;
        advance(run);
        afterFightWin(run);
      },
      onLose: (outcome) => {
        runBestWPM = Math.max(runBestWPM, outcome.wpm);
        recordFightOutcome(outcome, getLocale());
        showRunOver(run, 'lost');
      },
    })
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
  show((host) =>
    mountLevelUp(host, {
      player: run.player,
      favoredBoons: run.heroClass.favoredBoons,
      onChosen: () => afterLevelUp(run),
    })
  );
}

function afterLevelUp(run: RunState) {
  const nextFightNumber = run.fightNumber + 1;
  if (nextFightNumber === RUN_LENGTH) {
    // Final fight: dragon, fixed
    run.fightNumber = nextFightNumber;
    run.upcomingEnemy = findEnemy('dragon');
    showEncounter(run);
    return;
  }
  // Branch for next fight
  show((host) =>
    mountBranch(host, {
      tier: nextFightNumber,
      player: run.player,
      onPicked: (enemy, modifier) => {
        run.fightNumber = nextFightNumber;
        run.upcomingEnemy = enemy;
        applyModifier(run, modifier);
        showEncounter(run);
      },
    })
  );
}

function showRunOver(run: RunState, result: 'won' | 'lost') {
  const locale = getLocale();
  const prevBestRun = bestRun(locale);
  const prevBestWPM = bestWPM(locale);
  recordRunEnd(run.defeated, result === 'won', locale);
  const newRunRecord = run.defeated > prevBestRun;
  const newWPMRecord = runBestWPM > prevBestWPM;
  show((host) =>
    mountRunOver(host, {
      run,
      result,
      runBestWPM,
      newRunRecord,
      newWPMRecord,
      onRestart: startRun,
    })
  );
}

startRun();
