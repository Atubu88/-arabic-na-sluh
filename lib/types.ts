export type LessonLine = {
  id: string;
  speaker: string;
  arabic: string;
  translation: string;
  startMs: number;
  endMs: number;
};

export type LessonAnalysisItem = {
  arabic: string;
  explanation: string;
};

export type Lesson = {
  id: string;
  level: number;
  block: number;
  blockTitle: string;
  number: number;
  title: string;
  description: string;
  goal: string;
  audioUrl: string;
  audioStatus: "ready" | "placeholder";
  durationMs: number;
  lines: LessonLine[];
  shortAnalysis: LessonAnalysisItem[];
};

export type RatingKey = "again" | "hard" | "good" | "easy";

export type RatingOption = {
  key: RatingKey;
  label: string;
  intervalLabel: string;
  dueAt: string;
};

export type CardSummary = {
  lessonId: string;
  state: number;
  masteryLevel: number;
  dueAt: string;
  lastRating: RatingKey | null;
  reps: number;
  lapses: number;
  revision: number;
};

export type DashboardData = {
  user: {
    firstName: string;
    isDemo: boolean;
  };
  lessons: Lesson[];
  cards: CardSummary[];
  recommendedLessonId: string;
  dueToday: number;
  newLessons: number;
  progress: {
    learnedLessons: number;
    totalReviews: number;
    streakDays: number;
    nextDueAt: string | null;
  };
  settings: {
    enabled: boolean;
    timeLocal: string;
    timezoneOffsetMinutes: number;
  };
};
