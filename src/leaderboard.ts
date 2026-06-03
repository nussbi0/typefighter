import type { SeedResult } from './stats';

const CLIENT_KEY = 'typefighter.clientId.v1';
const NAME_KEY = 'typefighter.playerName.v1';

export interface LeaderEntry {
  rank: number;
  name: string;
  depth: number;
  bestWPM: number;
  classId: string;
  you: boolean;
}

export interface LeaderboardData {
  day: string;
  total: number;
  top: LeaderEntry[];
  you: { rank: number; total: number } | null;
}

export interface SubmitResult {
  rank: number;
  total: number;
}

// A stable anonymous id so re-runs update the player's row rather than spam.
export function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setPlayerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}

// All network calls degrade to null on any failure — the game never depends on
// the leaderboard being reachable.
export async function submitScore(
  day: string,
  name: string,
  r: SeedResult,
): Promise<SubmitResult | null> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        day,
        name,
        clientId: getClientId(),
        depth: r.depth,
        bestWPM: r.bestWPM,
        avgWPM: r.avgWPM,
        accuracy: r.accuracy,
        durationMs: r.durationMs,
        classId: r.classId,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SubmitResult;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(day: string): Promise<LeaderboardData | null> {
  try {
    const url = `/api/leaderboard?day=${encodeURIComponent(day)}&clientId=${getClientId()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardData;
  } catch {
    return null;
  }
}
