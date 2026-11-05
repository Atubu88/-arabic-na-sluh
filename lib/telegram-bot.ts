import type { AppEnv } from "./env";

type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

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

export async function sendStartMessage(env: AppEnv, chatId: string) {
  const appUrl = env.APP_URL;
  if (!appUrl) throw new Error("APP_URL не настроен");
  return telegramCall<{ message_id: number }>(env, "sendMessage", {
    chat_id: chatId,
    text: "Ас-саляму алейкум! Слушайте короткие арабские диалоги и повторяйте их в подходящий момент.",
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть «Арабский на слух»", web_app: { url: appUrl } }]],
    },
  });
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
