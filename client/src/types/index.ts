export type UserRole = 'user' | 'contest_admin' | 'super_admin';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalBattles: number;
  isSuspended?: boolean;
  createdAt: string;
}

export interface RatingHistoryEntry {
  id: string;
  battleId: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  createdAt: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SampleTestCase {
  id?: string;
  _id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  notes?: string;
  sampleTestCases: SampleTestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  supportedLanguages: number[];
  isPublished?: boolean;
  createdAt: string;
}

export type BattleState =
  | 'WAITING'
  | 'READY_CHECK'
  | 'COUNTDOWN'
  | 'ACTIVE'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type ScoringMode = 'first_accepted' | 'score_based' | 'time_based' | 'best_of_three';

export type ParticipantStatus = 'waiting' | 'connected' | 'ready' | 'coding' | 'submitted' | 'disconnected';

export interface BattleParticipant {
  userId: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  status: ParticipantStatus;
  isReady: boolean;
  score: number;
  submittedAt: string | null;
  verdict: string | null;
  ratingDelta: number;
}

export interface Battle {
  id: string;
  inviteCode: string;
  state: BattleState;
  scoringMode: ScoringMode;
  difficulty: Difficulty;
  durationSeconds: number;
  startTime: string | null;
  endTime: string | null;
  participants: BattleParticipant[];
  problemId: string | null;
  winnerId: string | null;
  isDraw: boolean;
  isPrivate: boolean;
  createdAt: string;
}

export type SubmissionVerdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'PARTIAL_SCORE'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'PENDING'
  | 'PROCESSING';

export interface TestCaseResult {
  testCaseId: string;
  verdict: SubmissionVerdict;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  isSample: boolean;
  scoreEarned: number;
  stdout?: string;
  stderr?: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  battleId: string | null;
  languageId: number;
  verdict: SubmissionVerdict;
  score: number;
  totalScore: number;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  compilationOutput: string | null;
  testCaseResults: TestCaseResult[];
  submittedAt: string;
  judgedAt: string | null;
}

export interface RunResult {
  testCaseId: string;
  stdin: string;
  stdout: string;
  stderr: string;
  expectedOutput: string | null;
  verdict: SubmissionVerdict;
  timeTakenMs: number | null;
  memoryUsedKb: number | null;
  isSample: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Language {
  id: number;
  name: string;
}
