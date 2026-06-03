import { onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { RUN_LENGTH } from './enemies';
import type { RunState } from './state';

export interface ResumePromptProps {
  run: RunState;
  onResume: () => void;
  onNew: () => void;
}

export function mountResumePrompt(host: HTMLElement, props: ResumePromptProps): () => void {
  const { run, onResume, onNew } = props;

  host.innerHTML = `
    <div class="scene resume-prompt">
      <h2 class="classselect-title with-drop-cap" data-i18n="resume_title"></h2>
      <p class="classselect-subtitle" data-summary></p>
      <div class="resume-actions">
        <button class="begin-fight" type="button" data-resume data-i18n="resume_continue"></button>
        <button class="reroll-button" type="button" data-new data-i18n="resume_new"></button>
      </div>
    </div>
  `;

  const root = host.querySelector('.resume-prompt') as HTMLElement;
  const summaryEl = root.querySelector('[data-summary]') as HTMLElement;
  const resumeBtn = root.querySelector('[data-resume]') as HTMLButtonElement;
  const newBtn = root.querySelector('[data-new]') as HTMLButtonElement;

  let resolved = false;
  function choose(fn: () => void) {
    if (resolved) return;
    resolved = true;
    fn();
  }

  function applyAll() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n!);
      if (el.classList.contains('with-drop-cap')) {
        renderTextWithDropCap(el, text);
      } else {
        el.textContent = text;
      }
    });
    const modeLabel = t(run.mode === 'endless' ? 'mode_endless' : 'mode_classic');
    const position =
      run.mode === 'endless'
        ? t('encounter_depth', { n: run.fightNumber })
        : t('encounter_title', { n: run.fightNumber, total: RUN_LENGTH });
    summaryEl.textContent = `${t(run.heroClass.nameKey)} · ${modeLabel} · ${position}`;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === '1' || e.key === 'Enter') {
      e.preventDefault();
      choose(onResume);
    } else if (e.key === '2') {
      e.preventDefault();
      choose(onNew);
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  resumeBtn.addEventListener('click', () => choose(onResume));
  newBtn.addEventListener('click', () => choose(onNew));
  document.addEventListener('keydown', onKey);
  resumeBtn.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
