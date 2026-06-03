import { describe, it, expect } from 'vitest';
import { randomWord } from './words';
import { getLocale } from './i18n';

describe('randomWord', () => {
  it('defaults to english', () => {
    expect(getLocale()).toBe('en');
  });

  it('draws only short words at level 1', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomWord(1).length).toBeLessThanOrEqual(4);
    }
  });

  it('draws longer words at high levels', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomWord(5).length).toBeGreaterThanOrEqual(6);
    }
  });

  it('clamps levels beyond the last band', () => {
    expect(typeof randomWord(99)).toBe('string');
    expect(randomWord(99).length).toBeGreaterThan(0);
  });

  it('defaults the level when called without one', () => {
    expect(randomWord().length).toBeLessThanOrEqual(4);
  });
});
