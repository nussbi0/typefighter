// Light (parchment) / dark (dungeon) theme. Defaults to the system setting and
// follows it live; once the player toggles, their choice is remembered and the
// system setting is ignored. The actual palette swap lives in style.css under
// [data-theme='dark']; this module just sets the attribute and persists intent.

const KEY = 'typefighter.theme';
export type Theme = 'light' | 'dark';

// First-paint background per theme, matched to the CSS so there's no flash
// before style.css loads through the module graph.
const BG: Record<Theme, string> = { light: '#9e8351', dark: '#15100a' };

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return storedTheme() ?? (systemPrefersDark() ? 'dark' : 'light');
}

function apply(theme: Theme): void {
  const el = document.documentElement;
  if (theme === 'dark') el.dataset.theme = 'dark';
  else delete el.dataset.theme;
  el.style.backgroundColor = BG[theme];
}

export function initTheme(): void {
  apply(currentTheme());
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // ignore unavailable storage
  }
  apply(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// Follow the OS setting live until the player makes an explicit choice.
export function watchSystemTheme(onChange: (t: Theme) => void): void {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener?.('change', () => {
    if (storedTheme() !== null) return; // an explicit choice wins
    apply(currentTheme());
    onChange(currentTheme());
  });
}
