import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon } from './audio';
import type { Relic } from './relics';

export interface RelicDraftProps {
  options: Relic[];
  onChosen: (relic: Relic) => void;
  onSkip: () => void;
}

export function mountRelicDraft(host: HTMLElement, props: RelicDraftProps): () => void {
  const { options, onChosen, onSkip } = props;

  host.innerHTML = `
    <div class="scene relic-draft">
      <h2 class="relic-title with-drop-cap" data-i18n="relic_title"></h2>
      <p class="relic-subtitle" data-i18n="relic_subtitle"></p>
      <div class="relic-grid"></div>
      <button class="reroll-button relic-skip" type="button" data-i18n="relic_skip"></button>
    </div>
  `;

  const root = host.querySelector('.relic-draft') as HTMLElement;
  const grid = root.querySelector('.relic-grid') as HTMLElement;
  const skipBtn = root.querySelector('.relic-skip') as HTMLButtonElement;

  options.forEach((relic, i) => {
    const card = document.createElement('button');
    card.className = 'boon-card relic-card';
    card.type = 'button';
    card.dataset.relic = relic.id;
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="boon-icon">${relic.icon}</div>
      <div class="boon-name with-drop-cap" data-i18n="${relic.nameKey}"></div>
      <div class="boon-desc" data-i18n="${relic.descKey}"></div>
    `;
    card.addEventListener('click', () => pick(relic));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(relic: Relic) {
    if (resolved) return;
    resolved = true;
    sfxBoon();
    onChosen(relic);
  }
  function skip() {
    if (resolved) return;
    resolved = true;
    onSkip();
  }

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

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      skip();
      return;
    }
    const idx = ['1', '2', '3'].indexOf(e.key);
    if (idx >= 0 && options[idx]) {
      e.preventDefault();
      pick(options[idx]);
    }
  }

  applyI18n();
  const offLocale = onLocaleChange(applyI18n);
  skipBtn.addEventListener('click', skip);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.relic-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
