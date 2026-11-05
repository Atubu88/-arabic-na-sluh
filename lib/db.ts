import { lessons } from "@/content/lessons";
import { emptyStoredCard, type StoredCard } from "./fsrs";
import type { AppEnv, RequestIdentity } from "./env";
import { getRuntimeEnv } from "./runtime-env";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    language_code TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notification_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    enabled INTEGER NOT NULL DEFAULT 1,
    time_local TEXT NOT NULL DEFAULT '19:00',
    timezone_offset_minutes INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS lesson_cards (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    due_at TEXT NOT NULL,
    stability REAL NOT NULL DEFAULT 0,
    difficulty REAL NOT NULL DEFAULT 0,
    elapsed_days INTEGER NOT NULL DEFAULT 0,
    scheduled_days INTEGER NOT NULL DEFAULT 0,
    learning_steps INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0,
    last_review TEXT,
    last_rating TEXT,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
  )`,
  `CREATE TABLE IF NOT EXISTS review_attempts (
    attempt_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    base_revision INTEGER NOT NULL,
    calculated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    options_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS review_history (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    attempt_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    base_revision INTEGER NOT NULL,
    rating TEXT NOT NULL,
    reviewed_at TEXT NOT NULL,
    due_at_before TEXT NOT NULL,
    due_at_after TEXT NOT NULL,
    state_before INTEGER NOT NULL,
    state_after INTEGER NOT NULL,
    outcome_json TEXT NOT NULL,
    UNIQUE (user_id, lesson_id, base_revision)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    due_at TEXT NOT NULL,
    status TEXT NOT NULL,
    telegram_message_id TEXT,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    error TEXT,
    UNIQUE (user_id, lesson_id, due_at)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_cards_due ON lesson_cards(due_at, user_id)",
  "CREATE INDEX IF NOT EXISTS idx_history_user_reviewed ON review_history(user_id, reviewed_at)",
  "CREATE INDEX IF NOT EXISTS idx_attempt_expiry ON review_attempts(expires_at)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_lookup ON notifications(user_id, lesson_id, due_at)",
];

let schemaReady: Promise<void> | null = null;

export function getD1() {
  const runtime = getRuntimeEnv() as AppEnv;
  if (!runtime.DB) throw new Error("D1 binding DB не настроен");
  return runtime.DB;
}

export async function ensureSchema(db = getD1()) {
  schemaReady ??= db.batch(schemaStatements.map((statement) => db.prepare(statement))).then(() => undefined);
  await schemaReady;
}

export async function upsertUser(db: D1Database, identity: RequestIdentity) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(
      `INSERT INTO users (
        user_id, telegram_id, first_name, last_name, username, language_code, is_demo, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        telegram_id = excluded.telegram_id,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        username = excluded.username,
        language_code = excluded.language_code,
        last_seen_at = excluded.last_seen_at`,
    ).bind(
      identity.userId,
      identity.telegramId,
      identity.firstName,
      identity.lastName,
      identity.username,
      identity.languageCode,
      identity.isDemo ? 1 : 0,
      now,
      now,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO notification_settings
       (user_id, enabled, time_local, timezone_offset_minutes, updated_at)
       VALUES (?, 1, '19:00', 0, ?)`,
    ).bind(identity.userId, now),
  ]);

  for (const lesson of lessons) {
    const card = emptyStoredCard(new Date());
    await db.prepare(
      `INSERT OR IGNORE INTO lesson_cards (
        user_id, lesson_id, due_at, stability, difficulty, elapsed_days,
        scheduled_days, learning_steps, reps, lapses, state, last_review,
        last_rating, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`,
    ).bind(
      identity.userId,
      lesson.id,
      card.dueAt,
      card.stability,
      card.difficulty,
      card.elapsedDays,
      card.scheduledDays,
      card.learningSteps,
      card.reps,
      card.lapses,
      card.state,
      card.lastReview,
      now,
    ).run();
  }
}

export type CardRow = {
  user_id: string;
  lesson_id: string;
  due_at: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  last_rating: string | null;
  revision: number;
};

export function storedCardFromRow(row: CardRow): StoredCard {
  return {
    dueAt: row.due_at,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    learningSteps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    lastReview: row.last_review,
  };
}

export async function getCard(db: D1Database, userId: string, lessonId: string) {
  return db.prepare("SELECT * FROM lesson_cards WHERE user_id = ? AND lesson_id = ?")
    .bind(userId, lessonId)
    .first<CardRow>();
}
