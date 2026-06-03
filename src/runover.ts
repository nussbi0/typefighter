import { getLocale, onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { RUN_LENGTH } from './enemies';
import type { RunState } from './state';
import { bestEndless, bestRun, bestWPM, totals, type SeedResult } from './stats';
import { getPlayerName, setPlayerName, submitScore } from './leaderboard';

export interface RunOverProps {
  run: RunState;
  result: 'won' | 'lost';
  runBestWPM: number;
  newRunRecord: boolean;
  newWPMRecord: boolean;
  newEndlessRecord: boolean;
  seedResult: SeedResult;
  newSeedRecord: boolean;
  onOpenLeaderboard: (day: string) => void;
  onRestart: () => void;
}

function shareUrl(seed: string, daily: boolean): string {
  const query = daily ? 'daily=1' : `seed=${encodeURIComponent(seed)}`;
  return `${location.origin}${location.pathname}?${query}`;
}

function formatTime(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function mountRunOver(host: HTMLElement, props: RunOverProps): () => void {
  const {
    run,
    result,
    runBestWPM,
    newRunRecord,
    newWPMRecord,
    newEndlessRecord,
    seedResult,
    newSeedRecord,
    onOpenLeaderboard,
    onRestart,
  } = props;
  const endless = run.mode === 'endless';

  host.innerHTML = `
    <div class="scene runover" data-result="${result}">
      <h2 class="runover-title with-drop-cap" data-title></h2>
      <p class="runover-count" data-count></p>
      <div class="runover-seed" data-seedblock hidden>
        <div class="seed-bar">
          <span class="seed-text" data-seedtext></span>
          <button class="seed-share" type="button" data-share data-i18n="seed_share"></button>
        </div>
        <dl class="runover-stats">
          <div class="stat-row"><dt data-i18n="stat_depth"></dt><dd data-sr-depth></dd></div>
          <div class="stat-row"><dt data-i18n="stat_best_wpm"></dt><dd data-sr-bestwpm></dd></div>
          <div class="stat-row"><dt data-i18n="stat_avg_wpm"></dt><dd data-sr-avgwpm></dd></div>
          <div class="stat-row"><dt data-i18n="stat_accuracy"></dt><dd data-sr-acc></dd></div>
          <div class="stat-row"><dt data-i18n="stat_time"></dt><dd data-sr-time></dd></div>
        </dl>
        <div class="lb-submit" data-lbsubmit hidden>
          <button class="seed-share" type="button" data-lbsubmit-btn data-i18n="leaderboard_submit"></button>
          <div class="lb-name-row" data-lbnamerow hidden>
            <input class="seed-input lb-name-input" type="text" maxlength="20" autocomplete="off" data-lbname />
            <button class="seed-share" type="button" data-lbname-ok data-i18n="leaderboard_name_confirm"></button>
          </div>
          <div class="lb-result" data-lbresult></div>
        </div>
      </div>
      <dl class="runover-stats">
        <div class="stat-row">
          <dt data-i18n="stat_best_fight"></dt>
          <dd data-best-fight></dd>
        </div>
        <div class="stat-row">
          <dt data-i18n="stat_record_wpm"></dt>
          <dd data-record-wpm></dd>
        </div>
        <div class="stat-row">
          <dt data-longest-label></dt>
          <dd data-longest-run></dd>
        </div>
        <div class="stat-row">
          <dt data-i18n="stat_runs_total"></dt>
          <dd data-runs-total></dd>
        </div>
      </dl>
      <button class="begin-fight runover-button" type="button" data-i18n="runover_restart"></button>
    </div>
  `;

  const root = host.querySelector('.runover') as HTMLElement;
  const titleEl = root.querySelector('[data-title]') as HTMLElement;
  const countEl = root.querySelector('[data-count]') as HTMLElement;
  const bestFightEl = root.querySelector('[data-best-fight]') as HTMLElement;
  const recordWPMEl = root.querySelector('[data-record-wpm]') as HTMLElement;
  const longestRunEl = root.querySelector('[data-longest-run]') as HTMLElement;
  const longestLabelEl = root.querySelector('[data-longest-label]') as HTMLElement;
  const runsTotalEl = root.querySelector('[data-runs-total]') as HTMLElement;
  const seedBlock = root.querySelector('[data-seedblock]') as HTMLElement;
  const seedTextEl = root.querySelector('[data-seedtext]') as HTMLElement;
  const shareBtn = root.querySelector('[data-share]') as HTMLButtonElement;
  const srDepthEl = root.querySelector('[data-sr-depth]') as HTMLElement;
  const srBestWpmEl = root.querySelector('[data-sr-bestwpm]') as HTMLElement;
  const srAvgWpmEl = root.querySelector('[data-sr-avgwpm]') as HTMLElement;
  const srAccEl = root.querySelector('[data-sr-acc]') as HTMLElement;
  const srTimeEl = root.querySelector('[data-sr-time]') as HTMLElement;
  const lbSubmit = root.querySelector('[data-lbsubmit]') as HTMLElement;
  const lbSubmitBtn = root.querySelector('[data-lbsubmit-btn]') as HTMLButtonElement;
  const lbNameRow = root.querySelector('[data-lbnamerow]') as HTMLElement;
  const lbNameInput = root.querySelector('[data-lbname]') as HTMLInputElement;
  const lbNameOk = root.querySelector('[data-lbname-ok]') as HTMLButtonElement;
  const lbResult = root.querySelector('[data-lbresult]') as HTMLElement;
  const btn = root.querySelector('.runover-button') as HTMLButtonElement;

  function renderStatValue(el: HTMLElement, text: string, isNewRecord: boolean) {
    el.textContent = text;
    if (isNewRecord) {
      const badge = document.createElement('span');
      badge.className = 'record-badge';
      badge.textContent = t('stat_new_record');
      el.append(' ', badge);
    }
  }

  function applyAll() {
    const locale = getLocale();
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n!);
    });
    const titleKey = endless
      ? 'runover_endless_over'
      : result === 'won'
        ? 'runover_won'
        : 'runover_lost';
    renderTextWithDropCap(titleEl, t(titleKey));
    countEl.textContent = endless
      ? t('runover_depth', { n: run.defeated })
      : t('runover_count', { n: run.defeated, total: RUN_LENGTH });

    renderStatValue(bestFightEl, t('stat_wpm_unit', { wpm: runBestWPM }), false);
    renderStatValue(recordWPMEl, t('stat_wpm_unit', { wpm: bestWPM(locale) }), newWPMRecord);
    if (endless) {
      longestLabelEl.textContent = t('stat_best_depth');
      renderStatValue(longestRunEl, String(bestEndless(locale)), newEndlessRecord);
    } else {
      longestLabelEl.textContent = t('stat_longest_run');
      renderStatValue(longestRunEl, `${bestRun(locale)} / ${RUN_LENGTH}`, newRunRecord);
    }
    const tot = totals();
    runsTotalEl.textContent = `${tot.runs} (${tot.clears})`;

    if (endless && run.seed) {
      seedBlock.hidden = false;
      seedTextEl.textContent = run.daily
        ? t('seed_daily', { seed: run.seed })
        : t('seed_label', { seed: run.seed });
      renderStatValue(srDepthEl, String(seedResult.depth), newSeedRecord);
      srBestWpmEl.textContent = t('stat_wpm_unit', { wpm: seedResult.bestWPM });
      srAvgWpmEl.textContent = t('stat_wpm_unit', { wpm: seedResult.avgWPM });
      srAccEl.textContent = `${Math.round(seedResult.accuracy * 100)}%`;
      srTimeEl.textContent = formatTime(seedResult.durationMs);
    } else {
      seedBlock.hidden = true;
    }
    lbSubmit.hidden = !run.daily;
    lbNameInput.placeholder = t('leaderboard_name_placeholder');
  }

  let submitting = false;
  let submitted = false;

  function doSubmit(name: string) {
    if (submitting || submitted) return;
    submitting = true;
    lbSubmitBtn.disabled = true;
    lbResult.textContent = t('leaderboard_submitting');
    submitScore(run.seed, name, seedResult).then((res) => {
      submitting = false;
      if (!res) {
        lbSubmitBtn.disabled = false;
        lbResult.textContent = t('leaderboard_error');
        return;
      }
      submitted = true;
      lbSubmitBtn.hidden = true;
      lbResult.textContent = `${t('leaderboard_rank', { n: res.rank, total: res.total })} `;
      const viewBtn = document.createElement('button');
      viewBtn.className = 'seed-share';
      viewBtn.type = 'button';
      viewBtn.textContent = t('leaderboard_view');
      viewBtn.addEventListener('click', () => onOpenLeaderboard(run.seed));
      lbResult.append(viewBtn);
    });
  }

  function onSubmitClick() {
    const name = getPlayerName();
    if (!name) {
      lbNameRow.hidden = false;
      lbNameInput.focus();
    } else {
      doSubmit(name);
    }
  }

  function confirmName() {
    const name = lbNameInput.value.trim();
    if (!name) return;
    setPlayerName(name);
    lbNameRow.hidden = true;
    doSubmit(name);
  }

  function share() {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(shareUrl(run.seed, run.daily))
      .then(() => {
        shareBtn.textContent = t('seed_copied');
        setTimeout(() => {
          shareBtn.textContent = t('seed_share');
        }, 1500);
      })
      .catch(() => {});
  }

  function onKey(e: KeyboardEvent) {
    if (e.target === shareBtn || lbSubmit.contains(e.target as Node)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRestart();
    }
  }

  function onNameKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmName();
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  btn.addEventListener('click', onRestart);
  shareBtn.addEventListener('click', share);
  lbSubmitBtn.addEventListener('click', onSubmitClick);
  lbNameOk.addEventListener('click', confirmName);
  lbNameInput.addEventListener('keydown', onNameKey);
  document.addEventListener('keydown', onKey);
  btn.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
