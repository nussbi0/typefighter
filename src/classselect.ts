import { onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { classes, type HeroClass } from './classes';
import { classPreview, combatStatLines } from './state';

export interface ClassSelectProps {
  onPick: (heroClass: HeroClass) => void;
}

export function mountClassSelect(host: HTMLElement, props: ClassSelectProps): () => void {
  const { onPick } = props;

  host.innerHTML = `
    <div class="scene classselect">
      <h2 class="classselect-title with-drop-cap" data-i18n="classselect_title"></h2>
      <p class="classselect-subtitle" data-i18n="classselect_subtitle"></p>
      <div class="class-grid"></div>
    </div>
  `;

  const root = host.querySelector('.classselect') as HTMLElement;
  const grid = root.querySelector('.class-grid') as HTMLElement;

  classes.forEach((c, i) => {
    const preview = classPreview(c);
    const stats = [
      { key: 'stat_hp', value: String(preview.maxHP) },
      ...combatStatLines(preview),
    ];
    const card = document.createElement('button');
    card.className = 'class-card';
    card.type = 'button';
    card.dataset.class = c.id;
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="class-avatar">${c.sprite}</div>
      <div class="class-name with-drop-cap" data-i18n="${c.nameKey}"></div>
      <div class="class-desc" data-i18n="${c.descKey}"></div>
      <dl class="stat-list class-stats">
        ${stats
          .map((s) => `<div class="stat-row"><dt data-i18n="${s.key}"></dt><dd>${s.value}</dd></div>`)
          .join('')}
      </dl>
    `;
    card.addEventListener('click', () => pick(c));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(c: HeroClass) {
    if (resolved) return;
    resolved = true;
    onPick(c);
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
  }

  function onKey(e: KeyboardEvent) {
    const idx = ['1', '2', '3'].indexOf(e.key);
    if (idx >= 0 && classes[idx]) {
      e.preventDefault();
      pick(classes[idx]);
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
