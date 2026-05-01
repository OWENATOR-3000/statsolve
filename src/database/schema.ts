import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("statsolve.db");
    await initialise(db);
  }
  return db;
}

async function initialise(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS solved_questions (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text       TEXT    NOT NULL,
      image_path          TEXT,
      topic               TEXT,
      solution            TEXT    NOT NULL,
      time_spent_seconds  INTEGER DEFAULT 0,
      is_bookmarked       INTEGER DEFAULT 0,
      is_verified         INTEGER DEFAULT 0,
      synced_at           TEXT,
      created_at          TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tutorials (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      topic        TEXT    UNIQUE NOT NULL,
      difficulty   TEXT    NOT NULL DEFAULT 'Intermediate',
      content      TEXT    NOT NULL,
      created_at   TEXT    DEFAULT (datetime('now')),
      last_accessed TEXT   DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      topic            TEXT    NOT NULL,
      difficulty       TEXT    NOT NULL DEFAULT 'Intermediate',
      questions_json   TEXT    NOT NULL,
      score            INTEGER DEFAULT 0,
      total            INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      synced_at        TEXT,
      created_at       TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topic_progress (
      topic          TEXT PRIMARY KEY,
      status         TEXT DEFAULT 'not_started',
      practice_count INTEGER DEFAULT 0,
      correct_count  INTEGER DEFAULT 0,
      last_activity  TEXT
    );
  `);
}
