import { describe, it, expect, beforeEach } from 'vitest';
import { saveRun, loadRun, clearRun } from './runstore';
import { newRun } from './state';
import { findClass } from './classes';

const knight = findClass('knight');
const KEY = 'typefighter.run.v1';

beforeEach(() => localStorage.clear());

describe('runstore', () => {
  it('round-trips a saved run', () => {
    const run = newRun(knight, 'endless');
    run.fightNumber = 3;
    run.defeated = 2;
    saveRun({ phase: 'levelup', run, runBestWPM: 42 });

    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.phase).toBe('levelup');
    expect(loaded!.runBestWPM).toBe(42);
    expect(loaded!.run.fightNumber).toBe(3);
    expect(loaded!.run.mode).toBe('endless');
    expect(loaded!.run.upcomingEnemy.id).toBe(run.upcomingEnemy.id);
  });

  it('returns null when nothing is saved', () => {
    expect(loadRun()).toBeNull();
  });

  it('clears a saved run', () => {
    saveRun({ phase: 'encounter', run: newRun(knight, 'classic'), runBestWPM: 0 });
    clearRun();
    expect(loadRun()).toBeNull();
  });

  it('ignores an unknown save version', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ v: 99, phase: 'encounter', run: newRun(knight, 'classic'), runBestWPM: 0 })
    );
    expect(loadRun()).toBeNull();
  });

  it('ignores corrupt data', () => {
    localStorage.setItem(KEY, '{ not valid json');
    expect(loadRun()).toBeNull();
  });
});
