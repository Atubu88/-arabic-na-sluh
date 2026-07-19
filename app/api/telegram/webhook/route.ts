import type { AppEnv } from "@/lib/env";
import { sendStartMessage } from "@/lib/telegram-bot";
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
  if (update.message?.text?.startsWith("/start")) {
    await sendStartMessage(runtime, String(update.message.chat.id));
  }
  return Response.json({ ok: true });
}
