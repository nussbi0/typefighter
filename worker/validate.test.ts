import { describe, it, expect } from 'vitest';
import { validateSubmission, todayUTC, MAX_WPM } from './validate';

const TODAY = '2026-06-03';

function base(over: Record<string, unknown> = {}) {
  return {
    day: TODAY,
    clientId: '12345678-1234-1234-1234-123456789abc',
    name: 'Dave',
    depth: 7,
    bestWPM: 80,
    avgWPM: 65,
    accuracy: 0.96,
    durationMs: 180000,
    classId: 'rogue',
    ...over,
  };
}

describe('validateSubmission', () => {
  it('accepts and normalizes a good submission', () => {
    const r = validateSubmission(base(), TODAY);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.depth).toBe(7);
      expect(r.value.name).toBe('Dave');
    }
  });

  it('rejects a non-object body', () => {
    expect(validateSubmission(null, TODAY).ok).toBe(false);
    expect(validateSubmission('x', TODAY).ok).toBe(false);
  });

  it('rejects a wrong day (no backfilling)', () => {
    expect(validateSubmission(base({ day: '2020-01-01' }), TODAY).ok).toBe(false);
  });

  it('rejects a malformed clientId', () => {
    expect(validateSubmission(base({ clientId: 'nope' }), TODAY).ok).toBe(false);
  });

  it('rejects an empty name and clamps a long one', () => {
    expect(validateSubmission(base({ name: '   ' }), TODAY).ok).toBe(false);
    const r = validateSubmission(base({ name: 'x'.repeat(50) }), TODAY);
    expect(r.ok && r.value.name.length).toBe(20);
  });

  it('strips control characters from names', () => {
    const r = validateSubmission(base({ name: `A${String.fromCharCode(1)}B` }), TODAY);
    expect(r.ok && r.value.name).toBe('AB');
  });

  it('caps implausible WPM and depth', () => {
    expect(validateSubmission(base({ bestWPM: MAX_WPM + 1 }), TODAY).ok).toBe(false);
    expect(validateSubmission(base({ depth: 9999 }), TODAY).ok).toBe(false);
    expect(validateSubmission(base({ depth: 2.5 }), TODAY).ok).toBe(false);
  });

  it('rejects a duration too short for the claimed depth', () => {
    expect(validateSubmission(base({ depth: 50, durationMs: 1000 }), TODAY).ok).toBe(false);
  });

  it('rejects an unknown class', () => {
    expect(validateSubmission(base({ classId: 'wizard' }), TODAY).ok).toBe(false);
  });
});

describe('todayUTC', () => {
  it('formats the UTC date', () => {
    expect(todayUTC(new Date(Date.UTC(2026, 5, 3, 23, 0, 0)))).toBe('2026-06-03');
  });
});
