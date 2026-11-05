import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { lessons } from "../content/lessons";

test("introduction block contains four complete audio lessons", () => {
  assert.equal(lessons.length, 4);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 4);
  for (const [index, lesson] of lessons.entries()) {
    assert.equal(lesson.level, 1);
    assert.equal(lesson.block, 1);
    assert.equal(lesson.blockTitle, "Знакомство");
    assert.equal(lesson.number, index + 1);
    assert.equal(lesson.audioStatus, "ready");
    assert.ok(existsSync(`public${lesson.audioUrl}`));
    assert.ok(lesson.goal.length > 0);
    assert.ok(lesson.shortAnalysis.length > 0);
  }
});

test("lesson timings are continuous, ordered and inside duration", () => {
  for (const lesson of lessons) {
    assert.ok(lesson.durationMs >= 10_000 && lesson.durationMs <= 40_000);
    assert.equal(lesson.lines[0]?.startMs, 0);
    lesson.lines.forEach((line, index) => {
      assert.ok(line.startMs < line.endMs);
      assert.ok(line.endMs <= lesson.durationMs);
      if (index > 0) assert.equal(line.startMs, lesson.lines[index - 1].endMs);
      assert.ok(line.arabic.length > 0);
      assert.ok(line.translation.length > 0);
    });
    assert.equal(lesson.lines.at(-1)?.endMs, lesson.durationMs);
  }
});
