import { onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { randomSeed } from './rng';

export interface CustomSeedProps {
  onStart: (seed: string) => void;
}

export function mountCustomSeed(host: HTMLElement, props: CustomSeedProps): () => void {
  const { onStart } = props;

  host.innerHTML = `
    <div class="scene customseed">
      <h2 class="classselect-title with-drop-cap" data-i18n="custom_title"></h2>
      <p class="classselect-subtitle" data-i18n="custom_subtitle"></p>
      <input class="seed-input" type="text" maxlength="32" autocomplete="off" spellcheck="false" data-input />
      <button class="begin-fight" type="button" data-start data-i18n="custom_start"></button>
    </div>
  `;

  const root = host.querySelector('.customseed') as HTMLElement;
  const input = root.querySelector('[data-input]') as HTMLInputElement;
  const startBtn = root.querySelector('[data-start]') as HTMLButtonElement;

  let resolved = false;
  function start() {
    if (resolved) return;
    resolved = true;
    onStart(input.value.trim() || randomSeed());
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
    input.placeholder = t('custom_placeholder');
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      start();
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  startBtn.addEventListener('click', start);
  input.addEventListener('keydown', onKey);
  input.focus();

  return () => {
    offLocale();
  };
}
