import { onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { RUN_LENGTH } from './enemies';
import type { RunMode } from './state';

export interface ModeSelectProps {
  onPick: (mode: RunMode) => void;
}

interface ModeOption {
  mode: RunMode;
  sprite: string;
  nameKey: string;
  descKey: string;
}

const options: ModeOption[] = [
  { mode: 'classic', sprite: '⚔️', nameKey: 'mode_classic', descKey: 'mode_classic_desc' },
  { mode: 'endless', sprite: '♾️', nameKey: 'mode_endless', descKey: 'mode_endless_desc' },
];

export function mountModeSelect(host: HTMLElement, props: ModeSelectProps): () => void {
  const { onPick } = props;

  host.innerHTML = `
    <div class="scene modeselect">
      <h2 class="classselect-title with-drop-cap" data-i18n="mode_title"></h2>
      <p class="classselect-subtitle" data-i18n="mode_subtitle"></p>
      <div class="mode-grid"></div>
    </div>
  `;

  const root = host.querySelector('.modeselect') as HTMLElement;
  const grid = root.querySelector('.mode-grid') as HTMLElement;

  options.forEach((opt, i) => {
    const card = document.createElement('button');
    card.className = 'class-card mode-card';
    card.type = 'button';
    card.dataset.mode = opt.mode;
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="class-avatar">${opt.sprite}</div>
      <div class="class-name with-drop-cap" data-i18n="${opt.nameKey}"></div>
      <div class="class-desc" data-i18n="${opt.descKey}"></div>
    `;
    card.addEventListener('click', () => pick(opt.mode));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(mode: RunMode) {
    if (resolved) return;
    resolved = true;
    onPick(mode);
  }

  function applyAll() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n!;
      const text = key === 'mode_classic_desc' ? t(key, { total: RUN_LENGTH }) : t(key);
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
      pick(options[idx].mode);
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.class-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
