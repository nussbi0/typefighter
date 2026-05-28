import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { upgrades, type PlayerStats, type Upgrade } from './state';

export interface LevelUpProps {
  player: PlayerStats;
  onChosen: () => void;
}

export function mountLevelUp(host: HTMLElement, props: LevelUpProps): () => void {
  const { player, onChosen } = props;

  host.innerHTML = `
    <div class="scene levelup">
      <h2 class="levelup-title with-drop-cap" data-i18n="levelup_title"></h2>
      <dl class="hero-stats-strip">
        <div class="stat-chip">
          <dt data-i18n="stat_hp"></dt>
          <dd>${player.hp} / ${player.maxHP}</dd>
        </div>
        <div class="stat-chip">
          <dt data-i18n="stat_atk"></dt>
          <dd>${player.atkMult.toFixed(2)}×</dd>
        </div>
        <div class="stat-chip">
          <dt data-i18n="stat_level"></dt>
          <dd>${player.level}</dd>
        </div>
      </dl>
      <div class="boon-grid"></div>
    </div>
  `;

  const root = host.querySelector('.levelup') as HTMLElement;
  const grid = root.querySelector('.boon-grid') as HTMLElement;

  upgrades.forEach((up, i) => {
    const card = document.createElement('button');
    card.className = 'boon-card';
    card.type = 'button';
    card.dataset.upgrade = up.id;
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="boon-icon">${up.icon}</div>
      <div class="boon-name with-drop-cap" data-i18n="${up.nameKey}"></div>
      <div class="boon-desc" data-i18n="${up.descKey}"></div>
    `;
    card.addEventListener('click', () => pick(up));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(up: Upgrade) {
    if (resolved) return;
    resolved = true;
    up.apply(player);
    onChosen();
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
    if (idx >= 0 && upgrades[idx]) {
      e.preventDefault();
      pick(upgrades[idx]);
    }
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.boon-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
