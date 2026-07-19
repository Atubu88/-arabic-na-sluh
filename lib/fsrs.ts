import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type RecordLogItem,
} from "ts-fsrs";
import type { RatingKey, RatingOption } from "./types";

type ReviewRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

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
  again: "Не помню",
  hard: "Трудно",
  good: "Нормально",
  easy: "Легко",
};

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

function storeResult(key: RatingKey, result: RecordLogItem): StoredSchedulingOption {
  return {
    key,
    card: storeCard(result.card),
    log: {
      rating: result.log.rating,
      state: result.log.state,
      dueAt: result.log.due.toISOString(),
      reviewedAt: result.log.review.toISOString(),
      elapsedDays: result.log.elapsed_days,
      scheduledDays: result.log.scheduled_days,
    },
  };
}

export function calculateOptions(card: StoredCard, now = new Date()) {
  const preview = scheduler.repeat(restoreCard(card), now);
  const keys: RatingKey[] = ["again", "hard", "good", "easy"];
  return keys.map((key) => storeResult(key, preview[ratingToFsrs[key]]));
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

export function publicOptions(
  options: StoredSchedulingOption[],
  calculatedAt: Date,
): RatingOption[] {
  return options.map((option) => ({
    key: option.key,
    label: ratingLabels[option.key],
    intervalLabel: formatInterval(calculatedAt, new Date(option.card.dueAt)),
    dueAt: option.card.dueAt,
  }));
}
