// ─── Auth ─────────────────────────────────────────────────────────────────────
export type SubscriptionStatus = "free" | "premium" | "cancelled";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  preferred_difficulty: Difficulty;
  dark_mode: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  daily_solves_used: number;
}

// ─── Topics ───────────────────────────────────────────────────────────────────
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type TopicStatus = "not_started" | "in_progress" | "completed";

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  color: string; // hex color for the topic card accent
}

export interface TopicProgress {
  topic: string;
  status: TopicStatus;
  practice_count: number;
  correct_count: number;
  last_activity: string | null;
}

// ─── Solver ───────────────────────────────────────────────────────────────────
export interface SolvedQuestion {
  id?: number;
  question_text: string;
  image_path?: string;
  topic?: string;
  solution: string;
  time_spent_seconds: number;
  is_bookmarked: boolean;
  created_at?: string;
  is_verified?: boolean;
}

// ─── Practice ─────────────────────────────────────────────────────────────────
export type PracticeResult = "correct" | "struggled" | "skipped";

export interface PracticeQuestion {
  index: number;
  question: string;
  solution: string;
  result?: PracticeResult;
  time_spent_seconds?: number;
}

export interface PracticeSession {
  id?: number;
  topicId?: string;      // slug id (e.g. "descriptive-stats") — for retry navigation
  topic: string;         // display title
  difficulty: Difficulty;
  questions: PracticeQuestion[];
  score: number;
  duration_seconds: number;
  created_at?: string;
}

// ─── Streaming ────────────────────────────────────────────────────────────────
export type SSEEvent =
  | { type: "delta"; text: string }
  | { type: "validation"; result: { passed: boolean; checks: unknown[] } }
  | { type: "done" }
  | { type: "error"; message: string };

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  Upgrade: undefined;
  Solution: { questionId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SolveTab: undefined;
  LearnTab: undefined;
  HistoryTab: undefined;
  CalculatorTab: undefined;
};

export type SolveStackParamList = {
  Solver: undefined;
  Solution: { questionId: number };
};

export type LearnStackParamList = {
  TopicList: undefined;
  TopicDetail: { topicId: string };
  Tutorial: { topicId: string; difficulty: Difficulty };
  Practice: { topicId: string; difficulty: Difficulty };
  PracticeReview: { sessionId: number; fallback?: PracticeSession };
};
