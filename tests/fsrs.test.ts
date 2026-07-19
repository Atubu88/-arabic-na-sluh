import assert from "node:assert/strict";
import test from "node:test";
import { calculateOptions, emptyStoredCard, publicOptions, restoreCard, scheduler } from "../lib/fsrs";
import { Rating } from "ts-fsrs";

test("FSRS calculates all four non-hardcoded outcomes", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");
  const card = emptyStoredCard(now);
  const options = calculateOptions(card, now);
  assert.deepEqual(options.map((option) => option.key), ["again", "hard", "good", "easy"]);
  for (const option of options) {
    assert.ok(new Date(option.card.dueAt) > now);
  }
  assert.ok(new Date(options[0].card.dueAt) <= new Date(options[3].card.dueAt));
  const labels = publicOptions(options, now).map((option) => option.intervalLabel);
  assert.equal(labels.length, 4);
  assert.ok(labels.every((label) => /мин|ч|дн|мес|г/.test(label)));
});

test("stored FSRS card survives serialization and continues scheduling", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");
  const first = calculateOptions(emptyStoredCard(now), now).find((option) => option.key === "good");
  assert.ok(first);
  const restored = restoreCard(JSON.parse(JSON.stringify(first.card)));
  assert.equal(restored.due.toISOString(), first.card.dueAt);
  const nextReview = new Date(first.card.dueAt);
  const second = scheduler.next(restored, nextReview, Rating.Good);
  assert.ok(second.card.reps > restored.reps);
  assert.ok(second.card.due > nextReview);
});
