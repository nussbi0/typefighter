-- Leaderboard scores: one best row per (day, client_id).
CREATE TABLE IF NOT EXISTS scores (
  day TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  depth INTEGER NOT NULL,
  best_wpm INTEGER NOT NULL,
  avg_wpm INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  class_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (day, client_id)
);

-- Ranking query: ORDER BY depth DESC, best_wpm DESC within a day.
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (day, depth DESC, best_wpm DESC);
