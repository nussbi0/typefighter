import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { sfxBoon, sfxManaReady } from './audio';
import { announce } from './a11y';
import {
  applyBoon,
  combatStatLines,
  drawBoons,
  SCHOOLS,
  setBonuses,
  SET_THRESHOLD,
  type PlayerStats,
  type Upgrade,
} from './state';
import { streamFor } from './rng';

export interface LevelUpProps {
  player: PlayerStats;
  favoredBoons: string[];
  seed: string;
  depth: number;
  bonusRerolls?: number;
  onChosen: () => void;
}

const DRAW_COUNT = 3;
const BASE_REROLLS = 1;

export function mountLevelUp(host: HTMLElement, props: LevelUpProps): () => void {
  const { player, favoredBoons, seed, depth, bonusRerolls = 0, onChosen } = props;
  const maxRerolls = BASE_REROLLS + bonusRerolls;

  const drawForReroll = (reroll: number) =>
    drawBoons(DRAW_COUNT, favoredBoons, streamFor(seed, 'boons', depth, reroll));

  host.innerHTML = `
    <div class="scene levelup">
      <h2 class="levelup-title with-drop-cap" data-i18n="levelup_title"></h2>
      <dl class="hero-stats-strip" data-strip></dl>
      <div class="set-strip" data-sets></div>
      <div class="boon-grid" data-grid></div>
      <button class="reroll-button" type="button" data-reroll></button>
    </div>
  `;

  const root = host.querySelector('.levelup') as HTMLElement;
  const strip = root.querySelector('[data-strip]') as HTMLElement;
  const sets = root.querySelector('[data-sets]') as HTMLElement;
  const grid = root.querySelector('[data-grid]') as HTMLElement;
  const rerollBtn = root.querySelector('[data-reroll]') as HTMLButtonElement;

  let current: Upgrade[] = drawForReroll(0);
  let rerollsLeft = maxRerolls;
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

  function renderSets() {
    const counts = player.schoolCounts ?? {};
    const awakened = player.awakenedSets ?? [];
    sets.innerHTML = SCHOOLS.map((school) => {
      const bonus = setBonuses[school];
      const have = Math.min(SET_THRESHOLD, counts[school] ?? 0);
      const isOn = awakened.includes(school);
      const pips = Array.from(
        { length: SET_THRESHOLD },
        (_, i) => `<span class="set-pip${i < have ? ' on' : ''}"></span>`,
      ).join('');
      return `<div class="set-track school-${school}${isOn ? ' awakened' : ''}"
          title="${t(bonus.descKey)}">
          <span class="set-icon">${bonus.icon}</span>
          <span class="set-name" data-i18n="${bonus.nameKey}"></span>
          <span class="set-pips">${pips}</span>
        </div>`;
    }).join('');
  }

  function renderBoons() {
    grid.innerHTML = '';
    current.forEach((up, i) => {
      const favored = favoredBoons.includes(up.id);
      const card = document.createElement('button');
      card.className = `boon-card school-${up.school}${favored ? ' favored' : ''}`;
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
        <div class="boon-school" data-i18n="school_${up.school}"></div>
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
    current = drawForReroll(maxRerolls - rerollsLeft);
    renderBoons();
    renderReroll();
    applyI18n();
    (grid.querySelector('.boon-card') as HTMLButtonElement | null)?.focus();
  }

  function pick(up: Upgrade) {
    if (resolved) return;
    resolved = true;
    const awakened = applyBoon(player, up);
    if (awakened) {
      // A set just came online — savor it before moving on.
      sfxManaReady();
      renderSets();
      applyI18n();
      const bonus = setBonuses[awakened];
      announce(`${t(bonus.nameKey)} — ${t(bonus.descKey)}`);
      const banner = document.createElement('div');
      banner.className = `set-awaken school-${awakened}`;
      renderTextWithDropCap(banner, t(bonus.nameKey));
      root.appendChild(banner);
      window.setTimeout(() => onChosen(), 1100);
      return;
    }
    sfxBoon();
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
  renderSets();
  renderBoons();
  renderReroll();
  applyI18n();
  const offLocale = onLocaleChange(() => {
    renderReroll();
    renderSets();
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
