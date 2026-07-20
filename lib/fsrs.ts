import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type RecordLogItem,
} from "ts-fsrs";
import type { RatingKey, RatingOption } from "./types";

type ReviewRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;
export type MasteryLevel = 1 | 2 | 3 | 4 | 5 | 6;

type ControlledInterval =
  | { unit: "minutes"; value: number; label: string }
  | { unit: "days"; value: number; label: string };

export const ratingToFsrs: Record<RatingKey, ReviewRating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const fsrsToRating: Record<number, RatingKey> = {
  [Rating.Again]: "again",
  [Rating.Hard]: "hard",
  [Rating.Good]: "good",
  [Rating.Easy]: "easy",
};

const ratingLabels: Record<RatingKey, string> = {
  again: "Не понял",
  hard: "Трудно",
  good: "Нормально",
  easy: "Легко",
};

const controlledIntervals: Record<MasteryLevel, Record<RatingKey, ControlledInterval>> = {
  1: {
    again: { unit: "minutes", value: 10, label: "10 мин" },
    hard: { unit: "days", value: 1, label: "1 день" },
    good: { unit: "days", value: 3, label: "3 дня" },
    easy: { unit: "days", value: 7, label: "7 дней" },
  },
  2: {
    again: { unit: "minutes", value: 10, label: "10 мин" },
    hard: { unit: "days", value: 2, label: "2 дня" },
    good: { unit: "days", value: 7, label: "7 дней" },
    easy: { unit: "days", value: 14, label: "14 дней" },
  },
  3: {
    again: { unit: "days", value: 1, label: "1 день" },
    hard: { unit: "days", value: 4, label: "4 дня" },
    good: { unit: "days", value: 14, label: "14 дней" },
    easy: { unit: "days", value: 30, label: "30 дней" },
  },
  4: {
    again: { unit: "days", value: 1, label: "1 день" },
    hard: { unit: "days", value: 7, label: "7 дней" },
    good: { unit: "days", value: 30, label: "30 дней" },
    easy: { unit: "days", value: 60, label: "60 дней" },
  },
  5: {
    again: { unit: "days", value: 3, label: "3 дня" },
    hard: { unit: "days", value: 14, label: "14 дней" },
    good: { unit: "days", value: 60, label: "60 дней" },
    easy: { unit: "days", value: 120, label: "120 дней" },
  },
  6: {
    again: { unit: "days", value: 3, label: "3 дня" },
    hard: { unit: "days", value: 28, label: "28 дней" },
    good: { unit: "days", value: 120, label: "120 дней" },
    easy: { unit: "days", value: 220, label: "220 дней" },
  },
};

const levelTransitions: Record<MasteryLevel, Record<RatingKey, MasteryLevel>> = {
  1: { again: 1, hard: 1, good: 2, easy: 3 },
  2: { again: 1, hard: 2, good: 3, easy: 4 },
  3: { again: 2, hard: 3, good: 4, easy: 5 },
  4: { again: 3, hard: 4, good: 5, easy: 6 },
  5: { again: 4, hard: 5, good: 6, easy: 6 },
  6: { again: 5, hard: 6, good: 6, easy: 6 },
};

export function normalizeMasteryLevel(value: number): MasteryLevel {
  if (Number.isInteger(value) && value >= 1 && value <= 6) return value as MasteryLevel;
  return 1;
}

export function nextMasteryLevel(level: MasteryLevel, rating: RatingKey): MasteryLevel {
  return levelTransitions[level][rating];
}

export function controlledInterval(level: MasteryLevel, rating: RatingKey) {
  return controlledIntervals[level][rating];
}

function controlledDue(from: Date, interval: ControlledInterval) {
  const milliseconds = interval.unit === "minutes"
    ? interval.value * 60_000
    : interval.value * 86_400_000;
  return new Date(from.getTime() + milliseconds);
}

export const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36_500,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ["10m"],
  relearning_steps: ["10m"],
});

export type StoredCard = {
  dueAt: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: string | null;
};

export type StoredSchedulingOption = {
  key: RatingKey;
  masteryLevel: MasteryLevel;
  intervalLabel: string;
  card: StoredCard;
  log: {
    rating: number;
    state: number;
    dueAt: string;
    reviewedAt: string;
    elapsedDays: number;
    scheduledDays: number;
  };
};

export function emptyStoredCard(now = new Date()): StoredCard {
  return storeCard(createEmptyCard(now));
}

export function storeCard(card: Card): StoredCard {
  return {
    dueAt: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review?.toISOString() ?? null,
  };
}

export function restoreCard(card: StoredCard): Card {
  return {
    due: new Date(card.dueAt),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
  };
}

function storeResult(
  key: RatingKey,
  result: RecordLogItem,
  dueAt: Date,
  masteryLevel: MasteryLevel,
  intervalLabel: string,
): StoredSchedulingOption {
  result.card.due = dueAt;
  result.card.scheduled_days = Math.max(0, Math.round((dueAt.getTime() - result.log.review.getTime()) / 86_400_000));
  return {
    key,
    masteryLevel,
    intervalLabel,
    card: storeCard(result.card),
    log: {
      rating: result.log.rating,
      state: result.log.state,
      dueAt: dueAt.toISOString(),
      reviewedAt: result.log.review.toISOString(),
      elapsedDays: result.log.elapsed_days,
      scheduledDays: result.log.scheduled_days,
    },
  };
}

export function calculateOptions(card: StoredCard, masteryLevel: MasteryLevel, now = new Date()) {
  const preview = scheduler.repeat(restoreCard(card), now);
  const keys: RatingKey[] = ["again", "hard", "good", "easy"];
  return keys.map((key) => {
    const interval = controlledInterval(masteryLevel, key);
    return storeResult(
      key,
      preview[ratingToFsrs[key]],
      controlledDue(now, interval),
      nextMasteryLevel(masteryLevel, key),
      interval.label,
    );
  });
}

export function formatInterval(from: Date, due: Date) {
  const minutes = Math.max(1, Math.round((due.getTime() - from.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} дн`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} мес`;
  const years = Math.round(days / 365);
  return `${years} г`;
}

export function publicOptions(options: StoredSchedulingOption[]): RatingOption[] {
  return options.map((option) => ({
    key: option.key,
    label: ratingLabels[option.key],
    intervalLabel: option.intervalLabel,
    dueAt: option.card.dueAt,
  }));
}
