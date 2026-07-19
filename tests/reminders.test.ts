import assert from "node:assert/strict";
import test from "node:test";
import { isNotificationWindow } from "../lib/time";

test("notification window respects user's local UTC offset", () => {
  const now = new Date("2026-07-18T17:05:00.000Z");
  assert.equal(isNotificationWindow(now, "19:00", 120), true);
  assert.equal(isNotificationWindow(now, "18:30", 120), false);
});
