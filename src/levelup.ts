import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon } from './audio';
import { combatStatLines, drawBoons, type PlayerStats, type Upgrade } from './state';

export interface LevelUpProps {
  player: PlayerStats;
  favoredBoons: string[];
  onChosen: () => void;
}

const DRAW_COUNT = 3;
const MAX_REROLLS = 1;

export function mountLevelUp(host: HTMLElement, props: LevelUpProps): () => void {
  const { player, favoredBoons, onChosen } = props;

  host.innerHTML = `
    <div class="scene levelup">
      <h2 class="levelup-title with-drop-cap" data-i18n="levelup_title"></h2>
      <dl class="hero-stats-strip" data-strip></dl>
      <div class="boon-grid" data-grid></div>
      <button class="reroll-button" type="button" data-reroll></button>
    </div>
  `;

  const root = host.querySelector('.levelup') as HTMLElement;
  const strip = root.querySelector('[data-strip]') as HTMLElement;
  const grid = root.querySelector('[data-grid]') as HTMLElement;
  const rerollBtn = root.querySelector('[data-reroll]') as HTMLButtonElement;

  let current: Upgrade[] = drawBoons(DRAW_COUNT, favoredBoons);
  let rerollsLeft = MAX_REROLLS;
  let resolved = false;

  function renderStrip() {
    const base = [
      { key: 'stat_hp', value: `${player.hp} / ${player.maxHP}` },
      { key: 'stat_atk', value: `${player.atkMult.toFixed(2)}×` },
      { key: 'stat_level', value: String(player.level) },
    ];
    const all = [...base, ...combatStatLines(player)];
    strip.innerHTML = all
      .map((s) => `<div class="stat-chip"><dt data-i18n="${s.key}"></dt><dd>${s.value}</dd></div>`)
      .join('');
  }

  function renderBoons() {
    grid.innerHTML = '';
    current.forEach((up, i) => {
      const favored = favoredBoons.includes(up.id);
      const card = document.createElement('button');
      card.className = favored ? 'boon-card favored' : 'boon-card';
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
        ${favored ? '<div class="boon-favored">✦ <span data-i18n="boon_favored"></span></div>' : ''}
      `;
      card.addEventListener('click', () => pick(up));
      grid.appendChild(card);
    });
  }

  function renderReroll() {
    rerollBtn.textContent = t('levelup_reroll', { n: rerollsLeft });
    rerollBtn.disabled = rerollsLeft <= 0;
  }

  function reroll() {
    if (rerollsLeft <= 0 || resolved) return;
    rerollsLeft -= 1;
    current = drawBoons(DRAW_COUNT, favoredBoons);
    renderBoons();
    renderReroll();
    applyI18n();
    (grid.querySelector('.boon-card') as HTMLButtonElement | null)?.focus();
  }

  function pick(up: Upgrade) {
    if (resolved) return;
    resolved = true;
    sfxBoon();
    up.apply(player);
    onChosen();
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
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      reroll();
      return;
    }
    const idx = ['1', '2', '3'].indexOf(e.key);
    if (idx >= 0 && current[idx]) {
      e.preventDefault();
      pick(current[idx]);
    }
  }

  renderStrip();
  renderBoons();
  renderReroll();
  applyI18n();
  const offLocale = onLocaleChange(() => {
    renderReroll();
    applyI18n();
  });
  rerollBtn.addEventListener('click', reroll);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.boon-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
