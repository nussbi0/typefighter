import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getClientId,
  getPlayerName,
  setPlayerName,
  submitScore,
  fetchLeaderboard,
} from './leaderboard';
import type { SeedResult } from './stats';

const sr: SeedResult = {
  depth: 5,
  bestWPM: 60,
  avgWPM: 50,
  accuracy: 0.95,
  durationMs: 120000,
  classId: 'knight',
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('client identity', () => {
  it('persists a stable client id', () => {
    expect(getClientId()).toBe(getClientId());
    expect(getClientId().length).toBeGreaterThan(0);
  });

  it('round-trips the player name', () => {
    setPlayerName('Dave');
    expect(getPlayerName()).toBe('Dave');
  });
});

describe('submitScore', () => {
  it('posts the run and returns the rank', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ rank: 2, total: 9 }) });
    vi.stubGlobal('fetch', fetchMock);
    const res = await submitScore('2026-06-03', 'Dave', sr);
    expect(res).toEqual({ rank: 2, total: 9 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.depth).toBe(5);
    expect(body.day).toBe('2026-06-03');
    expect(body.clientId).toBeTruthy();
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await submitScore('d', 'n', sr)).toBeNull();
  });

  it('returns null on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await submitScore('d', 'n', sr)).toBeNull();
  });
});

describe('fetchLeaderboard', () => {
  it('returns parsed data', async () => {
    const data = { day: 'd', total: 1, top: [], you: null };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    expect(await fetchLeaderboard('d')).toEqual(data);
  });

  it('returns null on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    expect(await fetchLeaderboard('d')).toBeNull();
  });
});
