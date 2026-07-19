CREATE TABLE `lesson_cards` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`due_at` text NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`elapsed_days` integer DEFAULT 0 NOT NULL,
	`scheduled_days` integer DEFAULT 0 NOT NULL,
	`learning_steps` integer DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`state` integer DEFAULT 0 NOT NULL,
	`last_review` text,
	`last_rating` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cards_due` ON `lesson_cards` (`due_at`,`user_id`);--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`time_local` text DEFAULT '19:00' NOT NULL,
	`timezone_offset_minutes` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`due_at` text NOT NULL,
	`status` text NOT NULL,
	`telegram_message_id` text,
	`created_at` text NOT NULL,
	`sent_at` text,
	`error` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_due_unique` ON `notifications` (`user_id`,`lesson_id`,`due_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_lookup` ON `notifications` (`user_id`,`lesson_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `review_attempts` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`base_revision` integer NOT NULL,
	`calculated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`options_json` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attempt_expiry` ON `review_attempts` (`expires_at`);--> statement-breakpoint
CREATE TABLE `review_history` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`base_revision` integer NOT NULL,
	`rating` text NOT NULL,
	`reviewed_at` text NOT NULL,
	`due_at_before` text NOT NULL,
	`due_at_after` text NOT NULL,
	`state_before` integer NOT NULL,
	`state_after` integer NOT NULL,
	`outcome_json` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_history_request_id_unique` ON `review_history` (`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `review_history_attempt_id_unique` ON `review_history` (`attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `review_history_card_revision_unique` ON `review_history` (`user_id`,`lesson_id`,`base_revision`);--> statement-breakpoint
CREATE INDEX `idx_history_user_reviewed` ON `review_history` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`telegram_id` text,
	`first_name` text NOT NULL,
	`last_name` text,
	`username` text,
	`language_code` text,
	`is_demo` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);