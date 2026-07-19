import { validate, validate3rd } from "@telegram-apps/init-data-node/web";

export type TelegramIdentity = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export async function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400,
  now = new Date(),
): Promise<TelegramIdentity> {
  const params = new URLSearchParams(initData);
  const authDate = Number(params.get("auth_date"));
  const hasSignature = Boolean(params.get("signature"));
  const botId = Number(botToken.split(":", 1)[0]);

  if (!Number.isFinite(authDate)) {
    throw new Error("Некорректные Telegram initData");
  }

  const age = Math.floor(now.getTime() / 1000) - authDate;
  if (age < -60 || age > maxAgeSeconds) {
    throw new Error("Telegram initData устарели");
  }

  try {
    if (hasSignature && Number.isFinite(botId)) {
      await validate3rd(initData, botId, { expiresIn: maxAgeSeconds });
    } else {
      await validate(initData, botToken, { expiresIn: maxAgeSeconds });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Подпись Telegram initData не совпадает";
    throw new Error(message);
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new Error("В initData отсутствует Telegram-пользователь");
  }

  const user = JSON.parse(rawUser) as TelegramIdentity;
  if (!Number.isSafeInteger(user.id) || !user.first_name) {
    throw new Error("В initData отсутствует Telegram-пользователь");
  }
  return user;
}
