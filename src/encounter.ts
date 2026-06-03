import { t, onLocaleChange, renderTextWithDropCap } from './i18n';
import { enemyAbilities, RUN_LENGTH, type Enemy } from './enemies';
import { combatStatLines, type PlayerStats } from './state';

function abilityTagsHTML(enemy: Enemy): string {
  return enemyAbilities(enemy)
    .map(
      (a) =>
        `<span class="ability-tag" title="${t(a.tip)}">${t(a.key, a.value != null ? { n: a.value } : undefined)}</span>`,
    )
    .join('');
}

export interface EncounterProps {
  enemy: Enemy;
  player: PlayerStats;
  playerSprite: string;
  encounterNumber: number;
  endless?: boolean;
  seed?: string;
  daily?: boolean;
  appliedHeal?: number;
  appliedMaxHP?: number;
  onStart: () => void;
}

function shareUrl(seed: string, daily: boolean): string {
  const query = daily ? 'daily=1' : `seed=${encodeURIComponent(seed)}`;
  return `${location.origin}${location.pathname}?${query}`;
}

export function mountEncounter(host: HTMLElement, props: EncounterProps): () => void {
  const {
    enemy,
    player,
    playerSprite,
    encounterNumber,
    endless = false,
    seed = '',
    daily = false,
    appliedHeal = 0,
    appliedMaxHP = 0,
    onStart,
  } = props;

  host.innerHTML = `
    <div class="scene encounter">
      <div class="encounter-header">
        <div class="encounter-counter" data-counter></div>
        <h2 class="encounter-flavor with-drop-cap" data-flavor></h2>
        <div class="encounter-boons" data-boons hidden></div>
        <div class="seed-bar" data-seedbar hidden>
          <span class="seed-text" data-seedtext></span>
          <button class="seed-share" type="button" data-share data-i18n="seed_share"></button>
        </div>
      </div>

      <div class="preview-grid">
        <div class="preview-card enemy-preview">
          <span class="corner corner-tl"></span>
          <span class="corner corner-tr"></span>
          <span class="corner corner-bl"></span>
          <span class="corner corner-br"></span>
          <div class="preview-avatar">${enemy.sprite}</div>
          <div class="preview-name with-drop-cap" data-i18n="${enemy.nameKey}"></div>
          <dl class="stat-list">
            <div class="stat-row"><dt data-i18n="stat_hp"></dt><dd>${enemy.maxHP}</dd></div>
            <div class="stat-row"><dt data-i18n="stat_damage"></dt><dd>${enemy.hitDamage}</dd></div>
            <div class="stat-row"><dt data-i18n="stat_speed"></dt><dd>${formatSpeed(enemy.msPerChar)}</dd></div>
          </dl>
          <div class="ability-tags" data-abilities></div>
        </div>

        <div class="vs vs-large" aria-label="versus">⚔</div>

        <div class="preview-card hero-preview">
          <span class="corner corner-tl"></span>
          <span class="corner corner-tr"></span>
          <span class="corner corner-bl"></span>
          <span class="corner corner-br"></span>
          <div class="preview-avatar">${playerSprite}</div>
          <div class="preview-name with-drop-cap" data-i18n="you"></div>
          <dl class="stat-list">
            <div class="stat-row"><dt data-i18n="stat_hp"></dt><dd>${player.hp} / ${player.maxHP}</dd></div>
            <div class="stat-row"><dt data-i18n="stat_atk"></dt><dd>${formatAtk(player.atkMult)}</dd></div>
            <div class="stat-row"><dt data-i18n="stat_level"></dt><dd>${player.level}</dd></div>
            ${combatStatLines(player)
              .map(
                (s) =>
                  `<div class="stat-row"><dt data-i18n="${s.key}"></dt><dd>${s.value}</dd></div>`,
              )
              .join('')}
          </dl>
        </div>
      </div>

      <button class="begin-fight" type="button" data-i18n="encounter_begin"></button>
    </div>
  `;

  const root = host.querySelector('.encounter') as HTMLElement;
  const counterEl = root.querySelector('[data-counter]') as HTMLElement;
  const flavorEl = root.querySelector('[data-flavor]') as HTMLElement;
  const boonsEl = root.querySelector('[data-boons]') as HTMLElement;
  const abilitiesEl = root.querySelector('[data-abilities]') as HTMLElement;
  const seedBar = root.querySelector('[data-seedbar]') as HTMLElement;
  const seedText = root.querySelector('[data-seedtext]') as HTMLElement;
  const shareBtn = root.querySelector('[data-share]') as HTMLButtonElement;
  const beginBtn = root.querySelector('.begin-fight') as HTMLButtonElement;

  function applyAll() {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n!);
      if (el.classList.contains('with-drop-cap')) {
        renderTextWithDropCap(el, text);
      } else {
        el.textContent = text;
      }
    });
    abilitiesEl.innerHTML = abilityTagsHTML(enemy);
    if (seed) {
      seedBar.hidden = false;
      seedText.textContent = daily ? t('seed_daily', { seed }) : t('seed_label', { seed });
    } else {
      seedBar.hidden = true;
    }
    counterEl.textContent = endless
      ? t('encounter_depth', { n: encounterNumber })
      : t('encounter_title', { n: encounterNumber, total: RUN_LENGTH });
    const flavorText = enemy.isBoss
      ? t('encounter_boss')
      : t('encounter_appears', { enemy: t(enemy.nameKey) });
    renderTextWithDropCap(flavorEl, flavorText);

    const chips: string[] = [];
    if (appliedHeal > 0)
      chips.push(`<span class="boon-chip">${t('encounter_healed', { n: appliedHeal })}</span>`);
    if (appliedMaxHP > 0)
      chips.push(`<span class="boon-chip">${t('encounter_max_boost', { n: appliedMaxHP })}</span>`);
    if (chips.length > 0) {
      boonsEl.innerHTML = chips.join('');
      boonsEl.hidden = false;
    } else {
      boonsEl.innerHTML = '';
      boonsEl.hidden = true;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.target === shareBtn) return; // let the share button handle its own keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStart();
    }
  }

  function share() {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(shareUrl(seed, daily))
      .then(() => {
        shareBtn.textContent = t('seed_copied');
        setTimeout(() => {
          shareBtn.textContent = t('seed_share');
        }, 1500);
      })
      .catch(() => {});
  }

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  beginBtn.addEventListener('click', onStart);
  shareBtn.addEventListener('click', share);
  document.addEventListener('keydown', onKey);
  beginBtn.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}

function formatSpeed(msPerChar: number): string {
  if (msPerChar >= 400) return '★';
  if (msPerChar >= 340) return '★★';
  if (msPerChar >= 300) return '★★★';
  return '★★★★';
}

function formatAtk(mult: number): string {
  return `${mult.toFixed(2)}×`;
}
