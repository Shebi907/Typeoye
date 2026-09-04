// ── Shared TypeScript types across the client ──────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Profile {
  _id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  levelTitle: string;
  totalXP: number;
  badges: string[];
}


export interface Settings {
  _id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  font: 'jetbrains' | 'fira' | 'cascadia';
  fontSize: number;
  soundEnabled: boolean;
  caretStyle: 'bar' | 'block' | 'underline';
  testDuration: 60 | 120 | 300 | 600 | 900;
  wordCount: number;
  includeNumbers: boolean;
  includePunctuation: boolean;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  order: number;
  isActive: boolean;
  accuracyThreshold: number;
  targetKeys: string[];
}

export interface CourseLesson extends Lesson {
  unlocked: boolean;
  completed: boolean;
  completedExercises: number;
  exerciseCount: number;
  bestAccuracy: number;
  attempts: number;
}

export interface Exercise {
  _id: string;
  lessonId: string;
  title: string;
  type: 'keys' | 'words' | 'sentences' | 'paragraph' | 'custom';
  language: 'en';
  level: number;
  content: string;
  targetKeys: string[];
  difficulty: number;
  order: number;
  isActive: boolean;
  variants?: string[];
  variantIndex?: number;
}

export interface LessonProgress {
  completedExerciseIds: string[];
  bestAccuracy: number;
  attempts: number;
  timeSpentSeconds: number;
  completedAt?: string;
}
export interface TypedWord {
  word: string;
  typed: string;
  correct: boolean;
  timeTakenMs: number;
}

export interface TypingResult {
  _id: string;
  sessionId: string;
  userId?: string;
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
  mode: string;
  createdAt: string;
}

export interface AchievementParams {
  minAccuracy?: number;
  minWpm?: number;
  minDuration?: number;
  requiredTests?: number;
}

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: { type: string; threshold: number };
  params?: AchievementParams;
}

export interface AchievementView extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number; // 0..threshold
}

/** Server-verified gamification payload returned after a saved session. */
export interface SessionRewards {
  xpEarned: number;
  leveledUp: boolean;
  prevXP: number;
  newXP: number;
  level: number;
  levelTitle: string;
  prevLevel: number;
  newAchievements: Achievement[];
}

export interface UserProgress {
  totalSessions: number;
  bestWpm: number | null;
  avgWpm: number;
  avgAccuracy: number;
  totalMinutesPracticed: number;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export interface AnalyticsTrend {
  date: string;
  value: number;
  max?: number;
  count?: number;
}

export interface WeakKey {
  key: string;
  errorCount: number;
  totalAttempts: number;
  errorRate: number;
}

export interface HistorySession { _id: string; type: 'test' | 'practice' | 'lesson' | 'game'; mode: string; wpm: number; accuracy: number; durationSeconds: number; createdAt: string; focusKeys?: string[]; }
export interface ModeStats { count: number; avgWpm: number; avgAccuracy: number; bestWpm: number; }
export interface LearnStats { completedLessons: number; totalLessons: number; completedExercises: number; avgAccuracy: number; timeSpentSeconds: number; }
export interface LessonHistory { _id: string; lessonId: string; title: string; bestAccuracy: number; attempts: number; timeSpentSeconds: number; completedAt: string; }
export interface ProgressStreak { current: number; longest: number; lastActiveDate: string | null; activeDates: string[]; }
export interface ProgressTotals { avgAccuracy: number; keystrokes: number; }
export interface ProgressData { modes: { test: ModeStats; practice: ModeStats }; learn: LearnStats; recent: { test: HistorySession[]; practice: HistorySession[]; lesson: LessonHistory[] }; trend: AnalyticsTrend[]; streak: ProgressStreak; totals: ProgressTotals; }
export interface DashboardData { progress: UserProgress; streak: Streak; charts: { wpm: AnalyticsTrend[]; accuracy: AnalyticsTrend[]; practice: { label: string; value: number }[]; learning: AnalyticsTrend[] }; coach: { recommendations: string[]; weakKeys: { key: string; errorRate: number }[]; recentSessions: number }; }
export type PracticeType = 'character' | 'combination' | 'word' | 'sentence' | 'paragraph' | 'weak' | 'quick' | 'custom';
export interface PracticeExercise {
  type: PracticeType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: 15 | 30 | 60 | 120 | 300 | 600 | 900;
  focusKeys: string[];
  content: string;
  summary: string;
  queue?: string[];
  rotation?: number;
  poolLength?: number;
}
export interface PracticeRecommendation { duration: 15 | 30 | 60 | 120 | 300 | 600 | 900; difficulty: 'beginner' | 'intermediate' | 'advanced'; focusKeys: string[]; type: PracticeType; }
export interface PracticeToday { count: number; seconds: number; }
export type LeaderboardPeriod = 'global' | 'daily' | 'weekly' | 'monthly';
export interface LeaderboardEntry {
  rank: number;
  userId?: string | null;
  username: string;
  displayName: string;
  level: number;
  wpm: number;
  accuracy: number;
  isMe: boolean;
}
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  me: Omit<LeaderboardEntry, 'isMe'> | null;
}

export type GameType = 'typingRace' | 'fallingWords' | 'suddenDeath';
export interface GameResult {
  _id: string;
  userId: string;
  game: GameType;
  score: number;
  wpm: number;
  accuracy: number;
  duration: number;
  winner?: 'user' | 'opponent';
  opponentWpm?: number;
  createdAt: string;
}

// ── Admin Panel types ─────────────────────────────────────────────────────

export interface AdminUserStats {
  sessions: number;
  bestWpm: number;
  avgAccuracy: number;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  stats: AdminUserStats;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalLessons: number;
  totalExercises: number;
  totalAchievements: number;
  totalTestParagraphs: number;
  totalPracticeParagraphs: number;
  totalWords: number;
  totalSentences: number;
  totalAdmins: number;
  avgWpm: number;
}

export interface AdminLesson extends Lesson {
  exerciseCount: number;
  activeExerciseCount: number;
}

export type ContentDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ContentItem {
  _id: string;
  content?: string;
  text?: string;
  difficulty: ContentDifficulty;
  topic?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAchievement extends Achievement {
  isActive: boolean;
}

export interface PlatformSettings {
  'leaderboard.minAccuracy': number;
  'leaderboard.topLimit': number;
  'games.wordRush.chunkWords'?: number;
  'certificate.durationSeconds'?: number;
}

export interface AdminLessonInput {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  isActive?: boolean;
  accuracyThreshold?: number;
  targetKeys?: string[];
}

export interface AdminExerciseInput {
  title: string;
  type: 'keys' | 'words' | 'sentences' | 'paragraph' | 'custom';
  level: number;
  content: string;
  targetKeys?: string[];
  difficulty: number;
  isActive?: boolean;
}

// ── Typing Engine types ────────────────────────────────────────────

export type TypingPhase = 'idle' | 'running' | 'finished';

export interface CharState {
  char: string;
  status: 'pending' | 'correct' | 'error' | 'current' | 'extra';
}

export interface WordState {
  word: string;
  chars: CharState[];
  status: 'pending' | 'active' | 'correct' | 'error';
  typed: string;
  startTime?: number;
  timeTakenMs?: number;
}

export interface EngineResult {
  typedWords: TypedWord[];
  durationSeconds: number;
  startTime: string;
  endTime: string;
  clientWpm: number;
  clientAccuracy: number;
  practiceType?: string;
  practiceDifficulty?: number;
  focusKeys?: string[];
}

export interface TestParagraph {
  _id: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

export interface SessionSubmitPayload {
  mode: 'test' | 'practice' | 'lesson' | 'game';
  startTime: string;
  endTime: string;
  typedWords: TypedWord[];
  textSource: 'generated' | 'lesson' | 'custom';
  exerciseId?: string;
  clientWpm: number;
  clientAccuracy: number;
  practiceType?: string;
  practiceDifficulty?: number;
  focusKeys?: string[];
}
