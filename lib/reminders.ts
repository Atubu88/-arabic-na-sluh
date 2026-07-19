import { lessons } from "@/content/lessons";
import type { AppEnv } from "./env";
import { ensureSchema } from "./db";
import { sendDueReminder } from "./telegram-bot";
import { isNotificationWindow } from "./time";

type DueRow = {
  user_id: string;
  telegram_id: string;
  lesson_id: string;
  due_at: string;
  time_local: string;
  timezone_offset_minutes: number;
  notification_status: string | null;
};

export async function processDueReminders(runtime: AppEnv, now = new Date()) {
  if (!runtime.BOT_TOKEN || !runtime.APP_URL || !runtime.DB) return { sent: 0, skipped: 0 };
  await ensureSchema(runtime.DB);
  const candidates = await runtime.DB.prepare(
    `SELECT c.user_id, u.telegram_id, c.lesson_id, c.due_at,
            s.time_local, s.timezone_offset_minutes, n.status AS notification_status
     FROM lesson_cards c
     JOIN users u ON u.user_id = c.user_id
     JOIN notification_settings s ON s.user_id = c.user_id
     LEFT JOIN notifications n
       ON n.user_id = c.user_id AND n.lesson_id = c.lesson_id AND n.due_at = c.due_at
     WHERE c.state <> 0 AND c.due_at <= ? AND s.enabled = 1
       AND u.telegram_id IS NOT NULL AND (n.status IS NULL OR n.status <> 'sent')
     ORDER BY c.due_at ASC
     LIMIT 100`,
  ).bind(now.toISOString()).all<DueRow>();

  let sent = 0;
  let skipped = 0;
  for (const candidate of candidates.results) {
    if (!isNotificationWindow(now, candidate.time_local, candidate.timezone_offset_minutes)) {
      skipped += 1;
      continue;
    }

    const current = await runtime.DB.prepare(
      "SELECT due_at FROM lesson_cards WHERE user_id = ? AND lesson_id = ? AND state <> 0",
    ).bind(candidate.user_id, candidate.lesson_id).first<{ due_at: string }>();
    if (!current || current.due_at !== candidate.due_at || new Date(current.due_at) > now) {
      skipped += 1;
      continue;
    }

    const notificationId = crypto.randomUUID();
    const claim = await runtime.DB.prepare(
      `INSERT OR IGNORE INTO notifications
       (id, user_id, lesson_id, due_at, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
    ).bind(
      notificationId,
      candidate.user_id,
      candidate.lesson_id,
      candidate.due_at,
      now.toISOString(),
    ).run();
    if ((claim.meta.changes ?? 0) === 0) {
      skipped += 1;
      continue;
    }

    try {
      const lesson = lessons.find((item) => item.id === candidate.lesson_id);
      const message = await sendDueReminder(
        runtime,
        candidate.telegram_id,
        candidate.lesson_id,
        lesson?.title ?? "Арабский диалог",
      );
      await runtime.DB.prepare(
        "UPDATE notifications SET status = 'sent', telegram_message_id = ?, sent_at = ? WHERE id = ?",
      ).bind(String(message.message_id), new Date().toISOString(), notificationId).run();
      sent += 1;
    } catch (error) {
      await runtime.DB.prepare(
        "UPDATE notifications SET status = 'failed', error = ? WHERE id = ?",
      ).bind(error instanceof Error ? error.message.slice(0, 500) : "Unknown error", notificationId).run();
    }
  }
  return { sent, skipped };
}
