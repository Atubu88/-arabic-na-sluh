import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("migration enforces one answer per attempt, request and card revision", async () => {
  const sql = await readFile(new URL("../drizzle/0000_smart_tarantula.sql", import.meta.url), "utf8");
  assert.match(sql, /review_history_request_id_unique/);
  assert.match(sql, /review_history_attempt_id_unique/);
  assert.match(sql, /review_history_card_revision_unique/);
});

test("migration enforces one reminder per exact due card", async () => {
  const sql = await readFile(new URL("../drizzle/0000_smart_tarantula.sql", import.meta.url), "utf8");
  assert.match(sql, /notifications_due_unique/);
});
