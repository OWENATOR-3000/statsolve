import { getDB } from "./schema";
import type { PracticeSession, PracticeQuestion } from "@/types";

// ─── Save a completed practice session ───────────────────────────────────────
export async function savePracticeSession(session: Omit<PracticeSession, "id" | "created_at">): Promise<number> {
  const db = await getDB();
  // Ensure topic_id column exists (migration guard)
  await db.execAsync(
    `ALTER TABLE practice_sessions ADD COLUMN topic_id TEXT`
  ).catch(() => { /* column already exists — ignore */ });

  const result = await db.runAsync(
    `INSERT INTO practice_sessions
       (topic, topic_id, difficulty, questions_json, score, total, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.topic,
      session.topicId ?? null,
      session.difficulty,
      JSON.stringify(session.questions),
      session.score,
      session.questions.length,
      session.duration_seconds,
    ]
  );

  // Also update topic_progress
  await db.runAsync(
    `INSERT INTO topic_progress (topic, status, practice_count, correct_count, last_activity)
     VALUES (?, 'in_progress', 1, ?, datetime('now'))
     ON CONFLICT(topic) DO UPDATE SET
       practice_count = practice_count + 1,
       correct_count  = correct_count + excluded.correct_count,
       last_activity  = datetime('now'),
       status         = CASE WHEN excluded.correct_count * 1.0 / ? >= 0.8 THEN 'completed' ELSE 'in_progress' END`,
    [session.topic, session.score, session.questions.length]
  );

  return result.lastInsertRowId;
}

// ─── Load a session by id ─────────────────────────────────────────────────────
export async function getPracticeSession(id: number): Promise<PracticeSession | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{
    id: number;
    topic: string;
    topic_id: string | null;
    difficulty: string;
    questions_json: string;
    score: number;
    duration_seconds: number;
    created_at: string;
  }>(`SELECT * FROM practice_sessions WHERE id = ?`, [id]);

  if (!row) return null;

  return {
    id: row.id,
    topicId: row.topic_id ?? undefined,
    topic: row.topic,
    difficulty: row.difficulty as any,
    questions: JSON.parse(row.questions_json) as PracticeQuestion[],
    score: row.score,
    duration_seconds: row.duration_seconds,
    created_at: row.created_at,
  };
}

// ─── Recent sessions for profile stats ───────────────────────────────────────
export async function getRecentPracticeSessions(limit = 10): Promise<PracticeSession[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: number;
    topic: string;
    difficulty: string;
    questions_json: string;
    score: number;
    duration_seconds: number;
    created_at: string;
  }>(`SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT ?`, [limit]);

  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    difficulty: row.difficulty as any,
    questions: JSON.parse(row.questions_json) as PracticeQuestion[],
    score: row.score,
    duration_seconds: row.duration_seconds,
    created_at: row.created_at,
  }));
}
