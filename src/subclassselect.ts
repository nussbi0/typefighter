import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon } from './audio';
import { subclassesFor, type Subclass } from './classes';
import type { PlayerStats } from './state';

export interface SubclassSelectProps {
  classId: string;
  player: PlayerStats;
  onChosen: (subclass: Subclass) => void;
}

export function mountSubclassSelect(host: HTMLElement, props: SubclassSelectProps): () => void {
  const { classId, onChosen } = props;
  const options = subclassesFor(classId);

  host.innerHTML = `
    <div class="scene ascend">
      <h2 class="ascend-title with-drop-cap" data-i18n="ascend_title"></h2>
      <p class="ascend-subtitle" data-i18n="ascend_subtitle"></p>
      <div class="ascend-grid"></div>
    </div>
  `;

  const root = host.querySelector('.ascend') as HTMLElement;
  const grid = root.querySelector('.ascend-grid') as HTMLElement;

  options.forEach((sub, i) => {
    const card = document.createElement('button');
    card.className = 'boon-card ascend-card';
    card.type = 'button';
    card.dataset.sub = sub.id;
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="boon-name with-drop-cap" data-i18n="${sub.nameKey}"></div>
      <div class="boon-desc" data-i18n="${sub.descKey}"></div>
    `;
    card.addEventListener('click', () => pick(sub));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(sub: Subclass) {
    if (resolved) return;
    resolved = true;
    sfxBoon();
    onChosen(sub);
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
    const idx = ['1', '2'].indexOf(e.key);
    if (idx >= 0 && options[idx]) {
      e.preventDefault();
      pick(options[idx]);
    }
  }

  applyI18n();
  const offLocale = onLocaleChange(applyI18n);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.ascend-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
