import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateOptions,
  controlledInterval,
  emptyStoredCard,
  nextMasteryLevel,
  publicOptions,
  type MasteryLevel,
} from "../lib/fsrs";
import type { RatingKey } from "../lib/types";

const ratings: RatingKey[] = ["again", "hard", "good", "easy"];

const expectedLabels: Record<MasteryLevel, string[]> = {
  1: ["10 мин", "1 день", "3 дня", "7 дней"],
  2: ["10 мин", "2 дня", "7 дней", "14 дней"],
  3: ["1 день", "4 дня", "14 дней", "30 дней"],
  4: ["1 день", "7 дней", "30 дней", "60 дней"],
  5: ["3 дня", "14 дней", "60 дней", "120 дней"],
  6: ["3 дня", "28 дней", "120 дней", "220 дней"],
};

test("every mastery level exposes the exact controlled intervals", () => {
  const now = new Date("2026-07-20T12:00:00.000Z");
  for (const level of [1, 2, 3, 4, 5, 6] as MasteryLevel[]) {
    const options = calculateOptions(emptyStoredCard(now), level, now);
    assert.deepEqual(publicOptions(options).map((option) => option.intervalLabel), expectedLabels[level]);
    assert.deepEqual(options.map((option) => option.key), ratings);
    assert.ok(options.every((option) => new Date(option.card.dueAt) > now));
  }
});

test("mastery transitions are deterministic and level six is reachable", () => {
  assert.deepEqual(ratings.map((rating) => nextMasteryLevel(1, rating)), [1, 1, 2, 3]);
  assert.deepEqual(ratings.map((rating) => nextMasteryLevel(4, rating)), [3, 4, 5, 6]);
  assert.deepEqual(ratings.map((rating) => nextMasteryLevel(5, rating)), [4, 5, 6, 6]);
  assert.deepEqual(ratings.map((rating) => nextMasteryLevel(6, rating)), [5, 6, 6, 6]);
});

test("controlled due dates match the interval table", () => {
  const now = new Date("2026-07-20T12:00:00.000Z");
  const options = calculateOptions(emptyStoredCard(now), 6, now);
  for (const option of options) {
    const interval = controlledInterval(6, option.key);
    const expectedMilliseconds = interval.unit === "minutes"
      ? interval.value * 60_000
      : interval.value * 86_400_000;
    assert.equal(new Date(option.card.dueAt).getTime() - now.getTime(), expectedMilliseconds);
  }
});
