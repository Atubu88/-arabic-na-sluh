ALTER TABLE `lesson_cards` ADD `mastery_level` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE `lesson_cards` SET `mastery_level` = CASE
  WHEN `reps` >= 10 THEN 6
  WHEN `reps` >= 7 THEN 5
  WHEN `reps` >= 5 THEN 4
  WHEN `reps` >= 3 THEN 3
  WHEN `reps` >= 1 THEN 2
  ELSE 1
END;
