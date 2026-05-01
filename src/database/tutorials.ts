import { getDB } from "./schema";
import type { Difficulty } from "@/types";

export interface CachedTutorial {
  id: number;
  topic: string;
  difficulty: Difficulty;
  content: string;
  created_at: string;
  last_accessed: string;
}

export async function getCachedTutorial(
  topic: string,
  difficulty: Difficulty
): Promise<CachedTutorial | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<CachedTutorial>(
    `SELECT * FROM tutorials WHERE topic = ? AND difficulty = ?`,
    [topic, difficulty]
  );

  if (row) {
    // Update last_accessed silently
    await db.runAsync(
      `UPDATE tutorials SET last_accessed = datetime('now') WHERE id = ?`,
      [row.id]
    );
  }

  return row ?? null;
}

export async function saveTutorial(
  topic: string,
  difficulty: Difficulty,
  content: string
): Promise<void> {
  const db = await getDB();
  // Upsert — replace if same topic+difficulty exists
  await db.runAsync(
    `INSERT INTO tutorials (topic, difficulty, content)
     VALUES (?, ?, ?)
     ON CONFLICT(topic) DO UPDATE SET
       content = excluded.content,
       difficulty = excluded.difficulty,
       last_accessed = datetime('now')`,
    [topic, difficulty, content]
  );
}
