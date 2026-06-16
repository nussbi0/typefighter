import type { Locale } from './i18n';

const STORAGE_KEY = 'typefighter.stats.v1';

export interface FightOutcome {
  wpm: number;
  correctChars: number;
  mistakes: number;
  elapsedMs: number;
  deedMet?: boolean; // an elite's optional feat was fulfilled this fight
}

// A complete, comparable record for one seeded run.
export interface SeedResult {
  depth: number; // foes defeated (endless depth reached)
  bestWPM: number;
  avgWPM: number;
  accuracy: number; // 0..1
  durationMs: number;
  classId: string;
}

export interface PersistedStats {
  bestRunByLocale: Record<string, number>;
  bestWPMByLocale: Record<string, number>;
  bestEndlessByLocale: Record<string, number>;
  seedResults: Record<string, SeedResult>;
  totalRuns: number;
  totalClears: number;
}

const emptyStats = (): PersistedStats => ({
  bestRunByLocale: {},
  bestWPMByLocale: {},
  bestEndlessByLocale: {},
  seedResults: {},
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

// Drops the in-memory cache (used by tests after clearing storage).
export function resetStatsCache(): void {
  cache = null;
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

export function recordEndlessEnd(depth: number, locale: Locale): void {
  const s = read();
  const prev = s.bestEndlessByLocale[locale] ?? 0;
  if (depth > prev) s.bestEndlessByLocale[locale] = depth;
  write(s);
}

export function bestRun(locale: Locale): number {
  return read().bestRunByLocale[locale] ?? 0;
}

export function bestEndless(locale: Locale): number {
  return read().bestEndlessByLocale[locale] ?? 0;
}

export function bestWPM(locale: Locale): number {
  return read().bestWPMByLocale[locale] ?? 0;
}

export function totals(): { runs: number; clears: number } {
  const s = read();
  return { runs: s.totalRuns, clears: s.totalClears };
}

// A higher run beats a lower one; ties break on best WPM.
function isBetter(a: SeedResult, b: SeedResult): boolean {
  return a.depth > b.depth || (a.depth === b.depth && a.bestWPM > b.bestWPM);
}

// Records the result if it beats the prior best for this seed. Returns whether
// it became the new best (for "new record" feedback).
export function recordSeedResult(seed: string, result: SeedResult): boolean {
  const s = read();
  const prev = s.seedResults[seed];
  if (prev && !isBetter(result, prev)) return false;
  s.seedResults[seed] = result;
  write(s);
  return true;
}

export function getSeedResult(seed: string): SeedResult | null {
  return read().seedResults[seed] ?? null;
}

// Recent daily results (seed keys shaped like a YYYY-MM-DD date), newest first.
export function recentDailies(limit = 5): { date: string; result: SeedResult }[] {
  const s = read();
  return Object.entries(s.seedResults)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limit)
    .map(([date, result]) => ({ date, result }));
}
