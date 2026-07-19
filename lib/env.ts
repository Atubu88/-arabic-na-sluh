export type AppEnv = {
  DB: D1Database;
  ASSETS?: Fetcher;
  IMAGES?: unknown;
  BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  APP_URL?: string;
  ALLOW_DEMO_MODE?: string;
  TELEGRAM_AUTH_MAX_AGE_SECONDS?: string;
};

export type RequestIdentity = {
  userId: string;
  telegramId: string | null;
  firstName: string;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
  isDemo: boolean;
};
