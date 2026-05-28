import { getLocale, onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { RUN_LENGTH } from './enemies';
import type { RunState } from './state';
import { bestRun, bestWPM, totals } from './stats';

export interface RunOverProps {
  run: RunState;
  result: 'won' | 'lost';
  runBestWPM: number;
  newRunRecord: boolean;
  newWPMRecord: boolean;
  onRestart: () => void;
}

export function mountRunOver(host: HTMLElement, props: RunOverProps): () => void {
  const { run, result, runBestWPM, newRunRecord, newWPMRecord, onRestart } = props;

  host.innerHTML = `
    <div class="scene runover" data-result="${result}">
      <h2 class="runover-title with-drop-cap" data-title></h2>
      <p class="runover-count" data-count></p>
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
          <dt data-i18n="stat_longest_run"></dt>
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
  const runsTotalEl = root.querySelector('[data-runs-total]') as HTMLElement;
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
    renderTextWithDropCap(titleEl, t(result === 'won' ? 'runover_won' : 'runover_lost'));
    countEl.textContent = t('runover_count', { n: run.defeated, total: RUN_LENGTH });

    renderStatValue(bestFightEl, t('stat_wpm_unit', { wpm: runBestWPM }), false);
    renderStatValue(recordWPMEl, t('stat_wpm_unit', { wpm: bestWPM(locale) }), newWPMRecord);
    renderStatValue(longestRunEl, `${bestRun(locale)} / ${RUN_LENGTH}`, newRunRecord);
    const tot = totals();
    runsTotalEl.textContent = `${tot.runs} (${tot.clears})`;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRestart();
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  btn.addEventListener('click', onRestart);
  document.addEventListener('keydown', onKey);
  btn.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
