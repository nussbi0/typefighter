import type { Locale } from './i18n';

const STORAGE_KEY = 'typefighter.stats.v1';

export interface FightOutcome {
  wpm: number;
  correctChars: number;
  elapsedMs: number;
}

export interface PersistedStats {
  bestRunByLocale: Record<string, number>;
  bestWPMByLocale: Record<string, number>;
  totalRuns: number;
  totalClears: number;
}

const emptyStats = (): PersistedStats => ({
  bestRunByLocale: {},
  bestWPMByLocale: {},
  totalRuns: 0,
  totalClears: 0,
});

let cache: PersistedStats | null = null;

function read(): PersistedStats {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedStats>;
      cache = { ...emptyStats(), ...parsed };
      return cache;
    }
  } catch {
    // localStorage unavailable or corrupt — fall through to empty
  }
  cache = emptyStats();
  return cache;
}

function write(s: PersistedStats): void {
  cache = s;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / unavailable
  }
}

export function loadStats(): PersistedStats {
  return read();
}

export function recordRunStart(): void {
  const s = read();
  s.totalRuns += 1;
  write(s);
}

export function recordRunEnd(defeated: number, cleared: boolean, locale: Locale): void {
  const s = read();
  const prev = s.bestRunByLocale[locale] ?? 0;
  if (defeated > prev) s.bestRunByLocale[locale] = defeated;
  if (cleared) s.totalClears += 1;
  write(s);
}

export function recordFightOutcome(outcome: FightOutcome, locale: Locale): void {
  if (outcome.wpm < 5) return;
  const s = read();
  const prev = s.bestWPMByLocale[locale] ?? 0;
  if (outcome.wpm > prev) s.bestWPMByLocale[locale] = outcome.wpm;
  write(s);
}

export function bestRun(locale: Locale): number {
  return read().bestRunByLocale[locale] ?? 0;
}

export function bestWPM(locale: Locale): number {
  return read().bestWPMByLocale[locale] ?? 0;
}

export function totals(): { runs: number; clears: number } {
  const s = read();
  return { runs: s.totalRuns, clears: s.totalClears };
}
