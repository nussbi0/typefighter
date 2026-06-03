import { onLocaleChange, renderTextWithDropCap, t } from './i18n';
import { enemyAbilities, type Enemy } from './enemies';
import type { Modifier, PlayerStats } from './state';

export interface BranchProps {
  enemies: Enemy[];
  player: PlayerStats;
  onPicked: (enemy: Enemy, modifier: Modifier) => void;
}

interface BranchOption {
  enemy: Enemy;
  modifier: Modifier;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function modIcon(m: Modifier): string {
  return m === 'refuge' ? '✚' : '❦';
}

function speedStars(msPerChar: number): string {
  if (msPerChar >= 400) return '★';
  if (msPerChar >= 340) return '★★';
  if (msPerChar >= 300) return '★★★';
  return '★★★★';
}

function buildOptions(pool: Enemy[]): BranchOption[] {
  if (pool.length < 2) {
    // Fallback: duplicate (shouldn't happen for designed pools)
    const e = pool[0];
    return [
      { enemy: e, modifier: 'refuge' },
      { enemy: e, modifier: 'empower' },
    ];
  }
  const enemies = shuffle(pool).slice(0, 2);
  const modifiers: Modifier[] = Math.random() < 0.5 ? ['refuge', 'empower'] : ['empower', 'refuge'];
  return enemies.map((enemy, i) => ({ enemy, modifier: modifiers[i] }));
}

export function mountBranch(host: HTMLElement, props: BranchProps): () => void {
  const { enemies, onPicked } = props;
  const options = buildOptions(enemies);

  host.innerHTML = `
    <div class="scene branch">
      <h2 class="branch-title with-drop-cap" data-i18n="branch_title"></h2>
      <p class="branch-subtitle" data-i18n="branch_subtitle"></p>
      <div class="branch-grid"></div>
    </div>
  `;

  const root = host.querySelector('.branch') as HTMLElement;
  const grid = root.querySelector('.branch-grid') as HTMLElement;

  options.forEach((opt, i) => {
    const card = document.createElement('button');
    card.className = 'branch-card';
    card.type = 'button';
    card.dataset.option = String(i);
    card.innerHTML = `
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
      <span class="boon-shortcut" aria-hidden="true">${i + 1}</span>
      <div class="branch-avatar">${opt.enemy.sprite}</div>
      <div class="branch-name with-drop-cap" data-i18n="${opt.enemy.nameKey}"></div>
      <dl class="stat-list branch-stats">
        <div class="stat-row"><dt data-i18n="stat_hp"></dt><dd>${opt.enemy.maxHP}</dd></div>
        <div class="stat-row"><dt data-i18n="stat_damage"></dt><dd>${opt.enemy.hitDamage}</dd></div>
        <div class="stat-row"><dt data-i18n="stat_speed"></dt><dd>${speedStars(opt.enemy.msPerChar)}</dd></div>
      </dl>
      <div class="ability-tags" data-abilities></div>
      <div class="branch-modifier">
        <span class="branch-modifier-icon" aria-hidden="true">${modIcon(opt.modifier)}</span>
        <div class="branch-modifier-text">
          <span class="branch-modifier-name with-drop-cap" data-i18n="modifier_${opt.modifier}"></span>
          <span class="branch-modifier-desc" data-i18n="modifier_${opt.modifier}_desc"></span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => pick(opt));
    grid.appendChild(card);
  });

  let resolved = false;
  function pick(opt: BranchOption) {
    if (resolved) return;
    resolved = true;
    onPicked(opt.enemy, opt.modifier);
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
    options.forEach((opt, i) => {
      const tags = grid.querySelector(`[data-option="${i}"] [data-abilities]`);
      if (tags) {
        tags.innerHTML = enemyAbilities(opt.enemy)
          .map(
            (a) =>
              `<span class="ability-tag" title="${t(a.tip)}">${t(a.key, a.value != null ? { n: a.value } : undefined)}</span>`
          )
          .join('');
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

  applyAll();
  const offLocale = onLocaleChange(applyAll);
  document.addEventListener('keydown', onKey);
  (grid.querySelector('.branch-card') as HTMLButtonElement | null)?.focus();

  return () => {
    offLocale();
    document.removeEventListener('keydown', onKey);
  };
}
