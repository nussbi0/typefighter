// Pure, runtime-agnostic validation for leaderboard submissions. Kept free of
// Workers APIs so it can be unit-tested directly. This is tier-1 "honor board"
// plausibility checking — it stops casual tampering, not a determined cheater.

export interface Submission {
  day: string;
  clientId: string;
  name: string;
  depth: number;
  bestWPM: number;
  avgWPM: number;
  accuracy: number;
  durationMs: number;
  classId: string;
}

export type ValidationResult = { ok: true; value: Submission } | { ok: false; error: string };

export const MAX_DEPTH = 200;
export const MAX_WPM = 300;
export const MIN_FIGHT_MS = 1500; // a single fight can't resolve faster than this
export const NAME_MAX = 20;
const CLASS_IDS = new Set(['knight', 'mage', 'rogue', 'templar', 'berserker']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function cleanName(v: unknown): string {
  if (typeof v !== 'string') return '';
  let out = '';
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue; // drop control characters
    out += ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

// Validates and normalizes a raw request body. `today` is the server's current
// UTC date string — submissions may only target the current daily seed.
export function validateSubmission(body: unknown, today: string): ValidationResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'bad body' };
  const b = body as Record<string, unknown>;

  if (b.day !== today) return { ok: false, error: 'wrong day' };
  if (typeof b.clientId !== 'string' || !UUID_RE.test(b.clientId)) {
    return { ok: false, error: 'bad clientId' };
  }

  const name = cleanName(b.name);
  if (name.length === 0) return { ok: false, error: 'bad name' };

  const depth = num(b.depth);
  const bestWPM = num(b.bestWPM);
  const avgWPM = num(b.avgWPM);
  const accuracy = num(b.accuracy);
  const durationMs = num(b.durationMs);
  if (
    depth === null ||
    bestWPM === null ||
    avgWPM === null ||
    accuracy === null ||
    durationMs === null
  ) {
    return { ok: false, error: 'missing fields' };
  }

  if (!Number.isInteger(depth) || depth < 0 || depth > MAX_DEPTH) {
    return { ok: false, error: 'bad depth' };
  }
  if (bestWPM < 0 || bestWPM > MAX_WPM || avgWPM < 0 || avgWPM > MAX_WPM) {
    return { ok: false, error: 'bad wpm' };
  }
  if (accuracy < 0 || accuracy > 1) return { ok: false, error: 'bad accuracy' };
  if (durationMs <= 0 || durationMs < depth * MIN_FIGHT_MS) {
    return { ok: false, error: 'implausible duration' };
  }
  if (typeof b.classId !== 'string' || !CLASS_IDS.has(b.classId)) {
    return { ok: false, error: 'bad class' };
  }

  return {
    ok: true,
    value: {
      day: today,
      clientId: b.clientId,
      name,
      depth,
      bestWPM: Math.round(bestWPM),
      avgWPM: Math.round(avgWPM),
      accuracy,
      durationMs: Math.round(durationMs),
      classId: b.classId,
    },
  };
}

// The current UTC date as YYYY-MM-DD (the daily seed / leaderboard key).
export function todayUTC(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
