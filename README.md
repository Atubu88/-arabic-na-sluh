# Арабский на слух

Рабочий MVP Telegram Mini App для изучения арабского языка через короткие синхронизированные аудиодиалоги и контролируемое интервальное повторение.

Один диалог — одна карточка памяти. Пользователь слушает урок целиком, оценивает понимание всего диалога, а сервер выбирает следующий срок по прозрачной шестиступенчатой шкале и сохраняет его в Cloudflare D1.

## Что реализовано

- адаптивный интерфейс Telegram Mini App: «Главная», «Путь», «Прогресс», «О пути»;
- синхронная подсветка текущей арабской реплики по `startMs` / `endMs`;
- приглушение уже прозвучавших реплик;
- перевод под каждой строкой с общим переключателем;
- скрытый по умолчанию «Короткий разбор» внутри каждого урока;
- play/pause, повтор с начала, ±10 секунд, прогресс и скорости 0.8× / 1× / 1.2×;
- одна оценка на весь урок: Again / Hard / Good / Easy;
- шесть контролируемых уровней с заранее понятными интервалами от 10 минут до 220 дней;
- `ts-fsrs` продолжает обновлять внутренние показатели сложности и стабильности карточки;
- атомарное сохранение новой карточки и истории в D1;
- защита от двойного ответа по `request_id`, `attempt_id` и ревизии карточки;
- серверная проверка подписи и срока действия Telegram `initData`;
- настройки времени и часового пояса уведомлений;
- Cloudflare Cron каждые 15 минут и напоминания через Telegram Bot API;
- защита от повторного уведомления для одинакового `due_at`;
- webhook бота для `/start` с кнопкой открытия Mini App;
- безопасный демо-режим без Telegram для локальной и публичной проверки;
- D1-миграция, модульные тесты и production build.

## Требования

- Node.js `22.13.0` или новее;
- npm `10` или новее;
- для реального деплоя: Cloudflare-аккаунт и Telegram-бот от [@BotFather](https://t.me/BotFather).

## Локальный запуск без Telegram

```bash
npm install
cp .env.example .env.local
npm run db:migrate:local
npm run dev -- --host 0.0.0.0
```

Откройте `http://localhost:5173`. Если Vite выбрал другой порт, он напечатает адрес в терминале.

Без Telegram клиент создаёт случайный demo-id в браузере. Это только идентификатор тестового пользователя; сам прогресс остаётся в локальной D1 и переживает перезагрузку страницы. Демо-доступ разрешён, только если `BOT_TOKEN` отсутствует или `ALLOW_DEMO_MODE=true`.

## Локальная проверка внутри Telegram

1. Скопируйте `.dev.vars.example` в `.dev.vars`.
2. Укажите реальный `BOT_TOKEN`.
3. Оставьте `ALLOW_DEMO_MODE=true`, чтобы обычный браузер тоже продолжал работать.
4. Поднимите HTTPS-туннель к локальному Vite и укажите его URL в настройках Mini App у BotFather.

Никогда не коммитьте `.dev.vars`.

## Аудио

Два блока по четыре урока находятся в `content/lessons.ts`. Готовые записи лежат в `public/audio`: `block-01-lesson-01.mp3` — `block-01-lesson-04.mp3` и `block-02-lesson-05.mp3` — `block-02-lesson-08.mp3`.

Точные длительности и границы реплик записаны рядом с учебным текстом в `content/lessons.ts`. При будущей замене MP3 нужно заново уточнить `durationMs`, `startMs` и `endMs` по паузам новой записи.

## Проверки

```bash
npm run typecheck
npm run lint
npm run test:unit
npm test
```

`npm test` запускает модульные тесты, production build, проверку Worker-артефакта и серверного HTML.

## Создание Cloudflare D1

Авторизуйтесь один раз:

```bash
npx wrangler login
```

Создайте базу:

```bash
npx wrangler d1 create arabic-na-sluh
```

Скопируйте выданный `database_id` в `wrangler.jsonc` вместо `00000000-0000-4000-8000-000000000000`, затем примените миграцию:

```bash
npm run db:migrate:remote
```

## Переменные и secrets

Обычные Worker vars в `wrangler.jsonc`:

- `APP_URL` — итоговый HTTPS URL приложения;
- `ALLOW_DEMO_MODE` — `false` для боевого Telegram-приложения;
- `TELEGRAM_AUTH_MAX_AGE_SECONDS` — допустимый возраст initData, по умолчанию `86400`.

Секреты Cloudflare:

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

- `BOT_TOKEN` — токен от BotFather, доступен только Worker;
- `TELEGRAM_WEBHOOK_SECRET` — случайная строка для проверки webhook Telegram.

Сгенерировать webhook secret можно, например, через менеджер паролей или `openssl rand -hex 32`.

## Деплой на Cloudflare Workers

Первый деплой:

```bash
npm run deploy:cloudflare
```

После него:

1. замените `APP_URL` в `wrangler.jsonc` на выданный `https://...workers.dev`;
2. повторите `npm run deploy:cloudflare`;
3. установите webhook, подставив значения локально в терминале:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"<APP_URL>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

4. В BotFather откройте `/mybots` → ваш бот → `Bot Settings` → `Menu Button` и укажите `APP_URL`.

Cron Trigger `*/15 * * * *` уже указан в `wrangler.jsonc` и публикуется вместе с Worker.

## Структура

```text
app/
  api/                    Worker API: bootstrap, preview, review, settings, webhook
  app-shell.tsx           весь пользовательский сценарий Mini App
  globals.css             адаптивная визуальная система
content/lessons.ts        локальный учебный контент и тайминги
db/schema.ts              D1-схема Drizzle
drizzle/                  SQL-миграции
lib/
  db.ts                   D1 schema guard и запросы
  fsrs.ts                 контролируемая шкала, переходы уровней и адаптер ts-fsrs
  reminders.ts            cron-очередь напоминаний
  request-auth.ts         Telegram/demo аутентификация
  telegram-auth.ts        проверка initData
  telegram-bot.ts         Telegram Bot API
public/audio/             локальные аудиофайлы
tests/                    интервалы, уровни, auth, content, idempotency, cron
worker/index.ts           Cloudflare fetch + scheduled entrypoint
wrangler.jsonc            Workers, D1, assets, vars и Cron Trigger
```

## Модель защиты от дублей

- каждый показ вариантов получает одноразовый `attempt_id` и снимок четырёх разрешённых исходов;
- один ответ имеет клиентский `request_id`;
- история содержит уникальные ограничения на `attempt_id`, `request_id` и `(user_id, lesson_id, base_revision)`;
- карточка обновляется только при совпадении ревизии;
- уведомления уникальны по `(user_id, lesson_id, due_at)`;
- cron повторно проверяет актуальный `due_at` непосредственно перед отправкой.

## Ограничения MVP

- шесть записей короче целевого диапазона 20–40 секунд, но полностью поддерживаются плеером;
- два учебных блока и один уровень;
- нет админ-панели: контент и тайминги редактируются в TypeScript;
- повторная автоматическая доставка Telegram-сообщения со статусом `failed` не выполняется, чтобы не рисковать дублями;
- streak считается по UTC-дням; для глобального продукта его стоит считать по часовому поясу пользователя;
- сроки повторения намеренно ограничены шестью прозрачными уровнями; автоматическая персонализация сроков не применяется.
