// Persists an in-progress run so it survives reloads / closing the tab.
// RunState is pure data (no functions), so it serializes directly. We save at
// screen boundaries (encounter / level-up / branch) and clear when a run ends.

import type { RunState } from './state';

const KEY = 'typefighter.run.v1';

export type RunPhase = 'encounter' | 'levelup' | 'branch';

export interface SavedRun {
  phase: RunPhase;
  run: RunState;
  runBestWPM: number;
}

interface Stored extends SavedRun {
  v: 1;
}

export function saveRun(saved: SavedRun): void {
  try {
    const data: Stored = { v: 1, ...saved };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or unavailable — non-fatal
  }
}

export function loadRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Stored>;
    if (data.v !== 1 || !data.phase || !data.run) return null;
    const run = data.run as RunState;
    if (!run.player || !run.heroClass || !run.upcomingEnemy) return null;
    return { phase: data.phase, run, runBestWPM: data.runBestWPM ?? 0 };
  } catch {
    return null;
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
