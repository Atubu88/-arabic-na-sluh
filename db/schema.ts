import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  languageCode: text("language_code"),
  isDemo: integer("is_demo").notNull().default(0),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
});

export const notificationSettings = sqliteTable("notification_settings", {
  userId: text("user_id").primaryKey().references(() => users.userId, { onDelete: "cascade" }),
  enabled: integer("enabled").notNull().default(1),
  timeLocal: text("time_local").notNull().default("19:00"),
  timezoneOffsetMinutes: integer("timezone_offset_minutes").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const lessonCards = sqliteTable("lesson_cards", {
  userId: text("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  dueAt: text("due_at").notNull(),
  stability: real("stability").notNull().default(0),
  difficulty: real("difficulty").notNull().default(0),
  elapsedDays: integer("elapsed_days").notNull().default(0),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  learningSteps: integer("learning_steps").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  state: integer("state").notNull().default(0),
  masteryLevel: integer("mastery_level").notNull().default(1),
  lastReview: text("last_review"),
  lastRating: text("last_rating"),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.lessonId] }),
  index("idx_cards_due").on(table.dueAt, table.userId),
]);

export const reviewAttempts = sqliteTable("review_attempts", {
  attemptId: text("attempt_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  baseRevision: integer("base_revision").notNull(),
  calculatedAt: text("calculated_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  optionsJson: text("options_json").notNull(),
}, (table) => [index("idx_attempt_expiry").on(table.expiresAt)]);

export const reviewHistory = sqliteTable("review_history", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  attemptId: text("attempt_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  baseRevision: integer("base_revision").notNull(),
  rating: text("rating").notNull(),
  reviewedAt: text("reviewed_at").notNull(),
  dueAtBefore: text("due_at_before").notNull(),
  dueAtAfter: text("due_at_after").notNull(),
  stateBefore: integer("state_before").notNull(),
  stateAfter: integer("state_after").notNull(),
  outcomeJson: text("outcome_json").notNull(),
}, (table) => [
  uniqueIndex("review_history_card_revision_unique").on(table.userId, table.lessonId, table.baseRevision),
  index("idx_history_user_reviewed").on(table.userId, table.reviewedAt),
]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  dueAt: text("due_at").notNull(),
  status: text("status").notNull(),
  telegramMessageId: text("telegram_message_id"),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
  error: text("error"),
}, (table) => [
  uniqueIndex("notifications_due_unique").on(table.userId, table.lessonId, table.dueAt),
  index("idx_notifications_lookup").on(table.userId, table.lessonId, table.dueAt),
]);
