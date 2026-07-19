import type { AppEnv, RequestIdentity } from "./env";
import { validateTelegramInitData } from "./telegram-auth";
import { getRuntimeEnv } from "./runtime-env";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function authenticateRequest(request: Request): Promise<RequestIdentity> {
  const runtime = getRuntimeEnv() as AppEnv;
  const initData = request.headers.get("x-telegram-init-data");

  if (initData) {
    if (!runtime.BOT_TOKEN) {
      throw new HttpError(503, "BOT_TOKEN не настроен");
    }
    try {
      const user = await validateTelegramInitData(
        initData,
        runtime.BOT_TOKEN,
        Number(runtime.TELEGRAM_AUTH_MAX_AGE_SECONDS ?? 86_400),
      );
      return {
        userId: `tg:${user.id}`,
        telegramId: String(user.id),
        firstName: user.first_name,
        lastName: user.last_name ?? null,
        username: user.username ?? null,
        languageCode: user.language_code ?? null,
        isDemo: false,
      };
    } catch (error) {
      const details = error instanceof Error ? error.message : "Ошибка Telegram-аутентификации";
      const sample = initData.slice(0, 900);
      const rawHeader = request.headers.get("x-telegram-init-data") ?? "";
      throw new HttpError(
        401,
        `${details} [initData_len=${initData.length} header_len=${rawHeader.length} initData sample: ${sample}]`,
      );
    }
  }

  const demoId = request.headers.get("x-demo-id");
  const demoAllowed = runtime.ALLOW_DEMO_MODE === "true" || !runtime.BOT_TOKEN;
  if (demoAllowed && demoId && /^[a-zA-Z0-9_-]{16,80}$/.test(demoId)) {
    return {
      userId: `demo:${demoId}`,
      telegramId: null,
      firstName: "Друг",
      lastName: null,
      username: null,
      languageCode: "ru",
      isDemo: true,
    };
  }

  throw new HttpError(401, "Откройте приложение через Telegram");
}

export function apiError(error: unknown) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Неизвестная ошибка";
  return Response.json({ error: message }, { status });
}
