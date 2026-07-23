import type { AppEnv } from "./env";

type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type AdminUserRow = {
  user_id: string;
  telegram_id: string | null;
  first_name: string;
  last_name: string | null;
  username: string | null;
  created_at: string;
  last_seen_at: string;
  is_demo: number;
};

type AdminProgressRow = {
  user_id: string;
  first_name: string;
  username: string | null;
  learned_lessons: number;
  total_reviews: number;
  due_now: number;
  last_reviewed_at: string | null;
};

const ADMIN_CHAT_IDS = new Set(["732402669"]);

export function isAdminChat(chatId: string) {
  return ADMIN_CHAT_IDS.has(chatId);
}

export async function telegramCall<T>(
  env: AppEnv,
  method: string,
  payload: Record<string, unknown>,
) {
  if (!env.BOT_TOKEN) throw new Error("BOT_TOKEN не настроен");
  const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as TelegramResponse<T>;
  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram API: ${response.status}`);
  }
  return data.result as T;
}

export async function sendMessage(env: AppEnv, chatId: string, text: string, replyMarkup?: Record<string, unknown>) {
  return telegramCall<{ message_id: number }>(env, "sendMessage", {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function sendStartMessage(env: AppEnv, chatId: string) {
  const appUrl = env.APP_URL;
  if (!appUrl) throw new Error("APP_URL не настроен");
  return sendMessage(
    env,
    chatId,
    "Ас-саляму алейкум! Слушайте короткие арабские диалоги и повторяйте их в подходящий момент.",
    {
      inline_keyboard: [[{ text: "Открыть «Арабский на слух»", web_app: { url: appUrl } }]],
    },
  );
}

export async function sendDueReminder(
  env: AppEnv,
  chatId: string,
  lessonId: string,
  lessonTitle: string,
) {
  const appUrl = env.APP_URL;
  if (!appUrl) throw new Error("APP_URL не настроен");
  const url = new URL(appUrl);
  url.searchParams.set("lesson", lessonId);
  return telegramCall<{ message_id: number }>(env, "sendMessage", {
    chat_id: chatId,
    text: `Пора освежить диалог на слух:\n«${lessonTitle}»`,
    reply_markup: {
      inline_keyboard: [[{ text: "Повторить сейчас", web_app: { url: url.toString() } }]],
    },
  });
}

export async function sendAdminUsersCount(env: AppEnv, chatId: string) {
  if (!env.DB) throw new Error("D1 binding DB не настроен");

  const [telegramCountRow, activeLearnersRow, totalReviewsRow] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE telegram_id IS NOT NULL").first<{ count: number }>(),
    env.DB.prepare(
      "SELECT COUNT(DISTINCT lc.user_id) as count FROM lesson_cards lc JOIN users u ON u.user_id = lc.user_id WHERE u.telegram_id IS NOT NULL AND lc.state != 0",
    ).first<{ count: number }>(),
    env.DB.prepare(
      "SELECT COUNT(*) as count FROM review_history rh JOIN users u ON u.user_id = rh.user_id WHERE u.telegram_id IS NOT NULL",
    ).first<{ count: number }>(),
  ]);

  const text = [
    "📊 Реальные участники",
    "",
    `Всего Telegram-пользователей: ${telegramCountRow?.count ?? 0}`,
    `Начали обучение: ${activeLearnersRow?.count ?? 0}`,
    `Всего review: ${totalReviewsRow?.count ?? 0}`,
  ].join("\n");

  return sendMessage(env, chatId, text);
}

export async function sendAdminLatestUsers(env: AppEnv, chatId: string) {
  if (!env.DB) throw new Error("D1 binding DB не настроен");

  const result = await env.DB.prepare(
    `SELECT user_id, telegram_id, first_name, last_name, username, created_at, last_seen_at, is_demo
     FROM users
     WHERE telegram_id IS NOT NULL
     ORDER BY datetime(created_at) DESC
     LIMIT 10`,
  ).all<AdminUserRow>();

  const rows = result.results ?? [];
  if (!rows.length) {
    return sendMessage(env, chatId, "Пока пользователей нет.");
  }

  const lines = rows.map((user, index) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Без имени";
    const username = user.username ? ` @${user.username}` : "";
    const marker = user.is_demo ? " [demo]" : "";
    return `${index + 1}. ${name}${username}${marker}\n   created: ${user.created_at}\n   last seen: ${user.last_seen_at}`;
  });

  return sendMessage(env, chatId, `🆕 Последние 10 пользователей\n\n${lines.join("\n\n")}`);
}

export async function sendAdminProgress(env: AppEnv, chatId: string) {
  if (!env.DB) throw new Error("D1 binding DB не настроен");

  const result = await env.DB.prepare(
    `SELECT
       u.user_id,
       u.first_name,
       u.username,
       COALESCE(cards.learned_lessons, 0) as learned_lessons,
       COALESCE(cards.due_now, 0) as due_now,
       COALESCE(reviews.total_reviews, 0) as total_reviews,
       reviews.last_reviewed_at as last_reviewed_at
     FROM users u
     LEFT JOIN (
       SELECT
         user_id,
         SUM(CASE WHEN state != 0 THEN 1 ELSE 0 END) as learned_lessons,
         SUM(CASE WHEN state != 0 AND datetime(due_at) <= datetime('now') THEN 1 ELSE 0 END) as due_now
       FROM lesson_cards
       GROUP BY user_id
     ) cards ON cards.user_id = u.user_id
     LEFT JOIN (
       SELECT
         user_id,
         COUNT(*) as total_reviews,
         MAX(reviewed_at) as last_reviewed_at
       FROM review_history
       GROUP BY user_id
     ) reviews ON reviews.user_id = u.user_id
     WHERE u.telegram_id IS NOT NULL
     ORDER BY total_reviews DESC, learned_lessons DESC, datetime(u.created_at) DESC
     LIMIT 10`,
  ).all<AdminProgressRow>();

  const rows = result.results ?? [];
  if (!rows.length) {
    return sendMessage(env, chatId, "Пока нет данных по прогрессу.");
  }

  const lines = rows.map((user, index) => {
    const username = user.username ? ` @${user.username}` : "";
    return `${index + 1}. ${user.first_name}${username}\n   уроков начато: ${user.learned_lessons}\n   review: ${user.total_reviews}\n   due сейчас: ${user.due_now}\n   последний review: ${user.last_reviewed_at ?? "—"}`;
  });

  return sendMessage(env, chatId, `📈 Прогресс пользователей\n\n${lines.join("\n\n")}`);
}
