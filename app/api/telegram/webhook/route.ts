import type { AppEnv } from "@/lib/env";
import {
  isAdminChat,
  sendAdminLatestUsers,
  sendAdminProgress,
  sendAdminUsersCount,
  sendStartMessage,
} from "@/lib/telegram-bot";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number };
  };
};

export async function POST(request: Request) {
  const runtime = getRuntimeEnv() as AppEnv;
  if (
    !runtime.TELEGRAM_WEBHOOK_SECRET ||
    request.headers.get("x-telegram-bot-api-secret-token") !== runtime.TELEGRAM_WEBHOOK_SECRET
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id ? String(message.chat.id) : null;

  if (!text || !chatId) {
    return Response.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    await sendStartMessage(runtime, chatId);
    return Response.json({ ok: true });
  }

  if (isAdminChat(chatId)) {
    if (text === "/users_count") {
      await sendAdminUsersCount(runtime, chatId);
      return Response.json({ ok: true });
    }

    if (text === "/last_users") {
      await sendAdminLatestUsers(runtime, chatId);
      return Response.json({ ok: true });
    }

    if (text === "/progress") {
      await sendAdminProgress(runtime, chatId);
      return Response.json({ ok: true });
    }
  }

  return Response.json({ ok: true });
}
