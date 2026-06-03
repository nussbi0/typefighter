import { validateSubmission, todayUTC } from './validate';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

interface ScoreRow {
  client_id: string;
  name: string;
  depth: number;
  best_wpm: number;
  avg_wpm: number;
  accuracy: number;
  duration_ms: number;
  class_id: string;
}

const LIMIT = 100;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function rankFor(
  env: Env,
  day: string,
  clientId: string,
): Promise<{ rank: number; total: number }> {
  const total =
    (
      await env.DB.prepare('SELECT COUNT(*) AS c FROM scores WHERE day=?1')
        .bind(day)
        .first<{ c: number }>()
    )?.c ?? 0;
  const me = await env.DB.prepare(
    'SELECT depth, best_wpm FROM scores WHERE day=?1 AND client_id=?2',
  )
    .bind(day, clientId)
    .first<{ depth: number; best_wpm: number }>();
  if (!me) return { rank: 0, total };
  const better =
    (
      await env.DB.prepare(
        'SELECT COUNT(*) AS c FROM scores WHERE day=?1 AND (depth>?2 OR (depth=?2 AND best_wpm>?3))',
      )
        .bind(day, me.depth, me.best_wpm)
        .first<{ c: number }>()
    )?.c ?? 0;
  return { rank: better + 1, total };
}

export async function handleSubmit(req: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const result = validateSubmission(body, todayUTC(new Date()));
  if (!result.ok) return json({ error: result.error }, 400);
  const s = result.value;

  // Upsert, keeping the better result (depth, then WPM) per (day, client_id).
  await env.DB.prepare(
    `INSERT INTO scores
       (day, client_id, name, depth, best_wpm, avg_wpm, accuracy, duration_ms, class_id, created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
     ON CONFLICT(day, client_id) DO UPDATE SET
       name=excluded.name, depth=excluded.depth, best_wpm=excluded.best_wpm,
       avg_wpm=excluded.avg_wpm, accuracy=excluded.accuracy,
       duration_ms=excluded.duration_ms, class_id=excluded.class_id,
       created_at=excluded.created_at
     WHERE excluded.depth > scores.depth
        OR (excluded.depth = scores.depth AND excluded.best_wpm > scores.best_wpm)`,
  )
    .bind(
      s.day,
      s.clientId,
      s.name,
      s.depth,
      s.bestWPM,
      s.avgWPM,
      s.accuracy,
      s.durationMs,
      s.classId,
      Date.now(),
    )
    .run();

  return json(await rankFor(env, s.day, s.clientId));
}

export async function handleTop(url: URL, env: Env): Promise<Response> {
  const day = url.searchParams.get('day') || todayUTC(new Date());
  const clientId = url.searchParams.get('clientId');
  const rows = await env.DB.prepare(
    `SELECT client_id, name, depth, best_wpm, avg_wpm, accuracy, duration_ms, class_id
     FROM scores WHERE day=?1 ORDER BY depth DESC, best_wpm DESC, duration_ms ASC LIMIT ?2`,
  )
    .bind(day, LIMIT)
    .all<ScoreRow>();

  const top = (rows.results ?? []).map((r, i) => ({
    rank: i + 1,
    name: r.name,
    depth: r.depth,
    bestWPM: r.best_wpm,
    classId: r.class_id,
    you: clientId != null && r.client_id === clientId,
  }));

  const meta = clientId ? await rankFor(env, day, clientId) : { rank: 0, total: top.length };
  return json({ day, total: meta.total, top, you: meta.rank > 0 ? meta : null });
}
