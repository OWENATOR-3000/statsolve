import { getDB } from "./schema";
import type { SolvedQuestion } from "@/types";

export async function saveQuestion(q: SolvedQuestion): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO solved_questions
       (question_text, image_path, topic, solution, time_spent_seconds, is_bookmarked, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      q.question_text,
      q.image_path ?? null,
      q.topic ?? null,
      q.solution,
      q.time_spent_seconds,
      q.is_bookmarked ? 1 : 0,
      q.is_verified ? 1 : 0,
    ]
  );
  return result.lastInsertRowId;
}

export async function getQuestions(limit = 50, offset = 0): Promise<SolvedQuestion[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<SolvedQuestion>(
    `SELECT * FROM solved_questions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows.map(mapRow);
}

export async function getQuestionById(id: number): Promise<SolvedQuestion | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<SolvedQuestion>(
    `SELECT * FROM solved_questions WHERE id = ?`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function toggleBookmark(id: number, bookmarked: boolean): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE solved_questions SET is_bookmarked = ? WHERE id = ?`,
    [bookmarked ? 1 : 0, id]
  );
}

export async function getQuestionCount(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM solved_questions`
  );
  return row?.count ?? 0;
}

export async function getBookmarkedQuestions(): Promise<SolvedQuestion[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<SolvedQuestion>(
    `SELECT * FROM solved_questions WHERE is_bookmarked = 1 ORDER BY created_at DESC`,
  );
  return rows.map(mapRow);
}

export async function searchQuestions(query: string): Promise<SolvedQuestion[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<SolvedQuestion>(
    `SELECT * FROM solved_questions
     WHERE question_text LIKE ? OR topic LIKE ?
     ORDER BY created_at DESC LIMIT 50`,
    [`%${query}%`, `%${query}%`]
  );
  return rows.map(mapRow);
}

// SQLite returns 0/1 for booleans — map back to proper types
function mapRow(row: any): SolvedQuestion {
  return {
    ...row,
    is_bookmarked: row.is_bookmarked === 1,
    is_verified:   row.is_verified   === 1,
  };
}
