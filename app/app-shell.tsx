"use client";

import {
  ArrowLeft,
  Bell,
  BellOff,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Gauge,
  Headphones,
  Home,
  Info,
  LoaderCircle,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Route,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DashboardData,
  Lesson,
  RatingKey,
  RatingOption,
} from "@/lib/types";

type Tab = "home" | "path" | "progress" | "about";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready(): void;
        expand(): void;
        setHeaderColor?(color: string): void;
        setBackgroundColor?(color: string): void;
        HapticFeedback?: {
          impactOccurred(style: "light" | "medium" | "heavy"): void;
          notificationOccurred(type: "success" | "error" | "warning"): void;
        };
      };
    };
  }
}

function clientUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function demoId() {
  const key = "arabic-na-sluh-demo-id";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = clientUuid();
    window.localStorage.setItem(key, value);
  }
  return value;
}

function authHeaders() {
  const initData = window.Telegram?.WebApp?.initData?.trim();
  return initData
    ? { "x-telegram-init-data": initData }
    : { "x-demo-id": demoId() };
}

async function waitForTelegramInitData(timeoutMs = 2200) {
  const startedAt = Date.now();
  let previous = "";
  let stableHits = 0;

  while (Date.now() - startedAt < timeoutMs) {
    const initData = window.Telegram?.WebApp?.initData?.trim() ?? "";
    if (initData && initData === previous) {
      stableHits += 1;
      if (stableHits >= 2) return initData;
    } else {
      stableHits = initData ? 1 : 0;
      previous = initData;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }

  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  for (const [name, value] of Object.entries(authHeaders())) {
    headers.set(name, value);
  }
  if (options.body) headers.set("content-type", "application/json");
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Не удалось выполнить запрос");
  return body;
}

function formatDate(value: string | null, includeTime = true) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const navigation: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "home", label: "Главная", icon: Home },
  { id: "path", label: "Путь", icon: Route },
  { id: "progress", label: "Прогресс", icon: TrendingUp },
  { id: "about", label: "О пути", icon: Info },
];

export default function AppShell() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [lessonId, setLessonId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const isTelegram = Boolean(window.Telegram?.WebApp);

    const loadOnce = async () => {
      await waitForTelegramInitData();
      return api<DashboardData>("/api/bootstrap");
    };

    try {
      let dashboard: DashboardData;
      try {
        dashboard = await loadOnce();
      } catch (firstError) {
        if (!isTelegram) throw firstError;
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        await waitForTelegramInitData(2500);
        dashboard = await loadOnce();
      }

      setData(dashboard);
      const deepLinkLesson = new URLSearchParams(window.location.search).get("lesson");
      if (deepLinkLesson) setLessonId(deepLinkLesson);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    }
  }, []);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    telegram?.ready();
    telegram?.expand();
    telegram?.setHeaderColor?.("#f4f0e7");
    telegram?.setBackgroundColor?.("#f4f0e7");
    queueMicrotask(() => void load());
  }, [load]);

  const openLesson = (id: string) => {
    setLessonId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("lesson", id);
    window.history.replaceState({}, "", url);
  };

  const closeLesson = () => {
    setLessonId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("lesson");
    window.history.replaceState({}, "", url);
  };

  if (!data && !error) {
    return (
      <main className="app-canvas centered-state">
        <div className="brand-mark"><Headphones size={28} /></div>
        <LoaderCircle className="spin" size={24} />
        <p>Готовим ваш путь…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-canvas centered-state">
        <CircleAlert size={38} />
        <h1>Не удалось открыть приложение</h1>
        <p>{error}</p>
        <button className="primary-button" onClick={() => void load()}>
          <RefreshCcw size={18} /> Попробовать снова
        </button>
      </main>
    );
  }

  const selectedLesson = data.lessons.find((lesson) => lesson.id === lessonId);
  if (selectedLesson) {
    return (
      <LessonScreen
        lesson={selectedLesson}
        onClose={closeLesson}
        onReviewed={load}
      />
    );
  }

  return (
    <main className="app-canvas">
      <div className="mobile-shell">
        {data.user.isDemo && (
          <div className="demo-strip">
            <Sparkles size={15} /> Демо-режим · прогресс сохраняется в D1
          </div>
        )}
        <div className="page-content">
          {tab === "home" && <HomeView data={data} openLesson={openLesson} />}
          {tab === "path" && <PathView data={data} openLesson={openLesson} />}
          {tab === "progress" && <ProgressView data={data} />}
          {tab === "about" && <AboutView data={data} onSaved={load} />}
        </div>
        <nav className="bottom-nav" aria-label="Основная навигация">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={tab === item.id ? 2.4 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}

function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function HomeView({ data, openLesson }: { data: DashboardData; openLesson(id: string): void }) {
  const recommended = data.lessons.find((lesson) => lesson.id === data.recommendedLessonId) ?? data.lessons[0];
  const card = data.cards.find((item) => item.lessonId === recommended?.id);
  const isReview = card && card.state !== 0 && new Date(card.dueAt) <= new Date();
  return (
    <>
      <header className="home-header">
        <div>
          <p className="eyebrow">Арабский на слух</p>
          <h1>Ас-саляму алейкум, {data.user.firstName}</h1>
        </div>
        <div className={`reminder-badge ${data.settings.enabled ? "on" : ""}`} title="Напоминания">
          {data.settings.enabled ? <Bell size={19} /> : <BellOff size={19} />}
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-topline">
          <span>{isReview ? "ПОВТОРЕНИЕ" : "СЕГОДНЯШНИЙ УРОК"}</span>
          <span className="duration"><Volume2 size={14} /> {Math.round((recommended?.durationMs ?? 0) / 1000)} сек</span>
        </div>
        <div className="arabic-ornament" dir="rtl">اِسْتَمِعْ وَافْهَمْ</div>
        <h2>{recommended?.title}</h2>
        <p>{recommended?.description}</p>
        <button className="hero-button" onClick={() => recommended && openLesson(recommended.id)}>
          <span className="play-dot"><Play size={18} fill="currentColor" /></span>
          {isReview ? "Повторить диалог" : "Начать слушать"}
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ритм обучения</p>
            <h2>На сегодня</h2>
          </div>
        </div>
        <div className="stat-grid two">
          <article className="stat-card warm">
            <RotateCcw size={22} />
            <strong>{data.dueToday}</strong>
            <span>повторений</span>
          </article>
          <article className="stat-card green">
            <BookOpen size={22} />
            <strong>{data.newLessons}</strong>
            <span>новых уроков</span>
          </article>
        </div>
      </section>

      <section className="notice-card">
        <div className="notice-icon"><Bell size={20} /></div>
        <div>
          <strong>{data.settings.enabled ? `Напомним в ${data.settings.timeLocal}` : "Напоминания выключены"}</strong>
          <p>{data.settings.enabled ? "Только когда наступит повторение" : "Включить можно в разделе «О пути»"}</p>
        </div>
      </section>
    </>
  );
}

function PathView({ data, openLesson }: { data: DashboardData; openLesson(id: string): void }) {
  const learned = data.cards.filter((card) => card.state !== 0).length;
  const percent = data.lessons.length ? Math.round((learned / data.lessons.length) * 100) : 0;
  const blocks = data.lessons.reduce<Array<{
    level: number;
    number: number;
    title: string;
    lessons: Lesson[];
  }>>((groups, lesson) => {
    let group = groups.find((item) => item.level === lesson.level && item.number === lesson.block);
    if (!group) {
      group = { level: lesson.level, number: lesson.block, title: lesson.blockTitle, lessons: [] };
      groups.push(group);
    }
    group.lessons.push(lesson);
    return groups;
  }, []);

  const blockDescriptions: Record<number, string> = {
    1: "Четыре коротких диалога: приветствие, происхождение, город и новые знакомые.",
    2: "Четыре коротких диалога: языки, понимание речи и общение с новыми людьми.",
  };

  return (
    <>
      <PageHeader
        eyebrow="Ваш маршрут"
        title="Путь"
        text="Небольшими диалогами — от узнавания речи к спокойному пониманию."
      />
      <section className="level-card">
        <div className="level-head">
          <div className="level-number">1</div>
          <div><span>УРОВЕНЬ 1</span><h2>Первые разговоры</h2></div>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
        <p>{learned} из {data.lessons.length} уроков начато</p>
      </section>
      {blocks.map((block) => (
        <section className="path-block" key={`${block.level}-${block.number}`}>
          <div className="block-intro">
            <div className="block-number">{block.number}</div>
            <div>
              <p className="eyebrow">Уровень {block.level} · Блок {block.number}</p>
              <h2>{block.title}</h2>
              <p>{blockDescriptions[block.number] ?? `${block.lessons.length} коротких аудиодиалога.`}</p>
            </div>
          </div>
          <div className="lesson-list">
            {block.lessons.map((lesson) => {
              const card = data.cards.find((item) => item.lessonId === lesson.id);
              const learnedLesson = Boolean(card && card.state !== 0);
              const due = learnedLesson && new Date(card!.dueAt) <= new Date();
              return (
                <button key={lesson.id} className="lesson-row" onClick={() => openLesson(lesson.id)}>
                  <span className={`lesson-index ${learnedLesson ? "done" : ""}`}>
                    {learnedLesson ? <Check size={18} /> : lesson.number}
                  </span>
                  <span className="lesson-copy">
                    <span className="lesson-meta">{due ? "ПОРА ПОВТОРИТЬ" : `${Math.round(lesson.durationMs / 1000)} СЕК · ДИАЛОГ`}</span>
                    <strong>{lesson.title}</strong>
                    <span>{learnedLesson ? `Следующий раз: ${formatDate(card!.dueAt)}` : lesson.description}</span>
                  </span>
                  <ChevronRight size={19} />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function ProgressView({ data }: { data: DashboardData }) {
  return (
    <>
      <PageHeader
        eyebrow="Без гонки"
        title="Прогресс"
        text="Здесь виден не счёт ради счёта, а ваш устойчивый ритм повторений."
      />
      <div className="stat-grid two progress-stats">
        <article className="metric-card"><BookOpen /><strong>{data.progress.learnedLessons}</strong><span>уроков изучено</span></article>
        <article className="metric-card"><RotateCcw /><strong>{data.progress.totalReviews}</strong><span>повторений</span></article>
        <article className="metric-card"><TrendingUp /><strong>{data.progress.streakDays}</strong><span>дней подряд</span></article>
        <article className="metric-card"><Gauge /><strong>{data.dueToday}</strong><span>готово сейчас</span></article>
      </div>
      <section className="next-review-card">
        <div className="notice-icon"><Bell size={20} /></div>
        <div>
          <p className="eyebrow">Ближайшее повторение</p>
          <h2>{data.progress.nextDueAt ? formatDate(data.progress.nextDueAt) : "После первого урока"}</h2>
          <p>Дата зависит от уровня карточки и вашей оценки всего диалога.</p>
        </div>
      </section>
      <section className="calm-card">
        <span className="arabic-mini" dir="rtl">قَلِيلٌ دَائِمٌ</span>
        <h2>Лучше понемногу, но регулярно</h2>
        <p>Здесь нет штрафов за пропуск. Следующий шаг всегда начинается с того места, где вы остановились.</p>
      </section>
    </>
  );
}

function AboutView({ data, onSaved }: { data: DashboardData; onSaved(): Promise<void> | void }) {
  const [enabled, setEnabled] = useState(data.settings.enabled);
  const [time, setTime] = useState(data.settings.timeLocal);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const save = async () => {
    setStatus("saving");
    await api("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        enabled,
        timeLocal: time,
        timezoneOffsetMinutes: -new Date().getTimezoneOffset(),
      }),
    });
    setStatus("saved");
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    await onSaved();
    window.setTimeout(() => setStatus("idle"), 1_500);
  };

  const ratings = [
    ["Не понял", "Диалог не удалось понять — вернёмся к нему раньше.", "again"],
    ["Трудно", "Поняли с усилием — интервал будет осторожным.", "hard"],
    ["Нормально", "Основной смысл понятен — обычный шаг вперёд.", "good"],
    ["Легко", "Поняли уверенно — можно сделать интервал длиннее.", "easy"],
  ];
  return (
    <>
      <PageHeader
        eyebrow="Как это работает"
        title="О пути"
        text="Один короткий диалог — одна единица памяти. Слушаем целиком и оцениваем понимание на слух."
      />
      <section className="method-card">
        <div className="method-step"><span>1</span><div><strong>Слушайте</strong><p>Следите за подсвеченной арабской репликой.</p></div></div>
        <div className="method-line" />
        <div className="method-step"><span>2</span><div><strong>Оцените весь диалог</strong><p>Не отдельное слово, а общее понимание на слух.</p></div></div>
        <div className="method-line" />
        <div className="method-step"><span>3</span><div><strong>Вернитесь вовремя</strong><p>Следующий срок зависит от уровня карточки и вашей оценки.</p></div></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Четыре оценки</p><h2>Отвечайте честно</h2></div></div>
        <div className="rating-explainer">
          {ratings.map(([label, description, key]) => (
            <div key={key} className={`rating-note ${key}`}><span>{label}</span><p>{description}</p></div>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-title"><Settings2 size={22} /><div><h2>Напоминания</h2><p>Одно сообщение, когда карточка готова.</p></div></div>
        <label className="switch-row">
          <span>{enabled ? "Включены" : "Выключены"}</span>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span className="switch" />
        </label>
        <label className="time-row">
          <span>Удобное время</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} disabled={!enabled} />
        </label>
        <button className="secondary-button" onClick={() => void save()} disabled={status === "saving"}>
          {status === "saving" ? <LoaderCircle className="spin" size={17} /> : status === "saved" ? <Check size={17} /> : <Bell size={17} />}
          {status === "saved" ? "Сохранено" : "Сохранить настройки"}
        </button>
      </section>
    </>
  );
}

function LessonScreen({ lesson, onClose, onReviewed }: { lesson: Lesson; onClose(): void; onReviewed(): Promise<void> | void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [translation, setTranslation] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [listened, setListened] = useState(false);
  const [preview, setPreview] = useState<{ attemptId: string; masteryLevel: number; options: RatingOption[] } | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState<RatingKey | null>(null);
  const [result, setResult] = useState<{ dueAt: string; rating: RatingKey } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousFrame = useRef<number | null>(null);

  useEffect(() => {
    if (lesson.audioStatus !== "placeholder" || !playing) return;
    const tick = (time: number) => {
      const previous = previousFrame.current ?? time;
      previousFrame.current = time;
      setElapsed((current) => {
        const next = Math.min(lesson.durationMs, current + (time - previous) * speed);
        if (next >= lesson.durationMs) {
          setPlaying(false);
          setListened(true);
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      previousFrame.current = null;
    };
  }, [lesson.audioStatus, lesson.durationMs, playing, speed]);

  useEffect(() => {
    if (!listened || preview || previewError || result) return;
    api<{ attemptId: string; masteryLevel: number; options: RatingOption[] }>(`/api/lessons/${lesson.id}/preview`, { method: "POST" })
      .then(setPreview)
      .catch((error) => setPreviewError(error instanceof Error ? error.message : "Не удалось рассчитать интервалы"));
  }, [lesson.id, listened, preview, previewError, result]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  const seek = (value: number) => {
    const next = Math.max(0, Math.min(lesson.durationMs, value));
    setElapsed(next);
    if (audioRef.current) audioRef.current.currentTime = next / 1_000;
    if (next >= lesson.durationMs - 250) setListened(true);
  };

  const togglePlay = async () => {
    if (elapsed >= lesson.durationMs) seek(0);
    if (lesson.audioStatus === "ready" && audioRef.current) {
      if (playing) audioRef.current.pause();
      else {
        audioRef.current.playbackRate = speed;
        await audioRef.current.play();
      }
    }
    setPlaying((value) => !value);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  const restart = async () => {
    seek(0);
    if (lesson.audioStatus === "ready" && audioRef.current) {
      audioRef.current.playbackRate = speed;
      await audioRef.current.play();
    }
    setPlaying(true);
  };

  const setPlaybackSpeed = (next: number) => {
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const submitRating = async (rating: RatingKey) => {
    if (!preview || submitting || result) return;
    setSubmitting(rating);
    try {
      const response = await api<{ dueAt: string; rating: RatingKey }>(`/api/lessons/${lesson.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          attemptId: preview.attemptId,
          requestId: clientUuid(),
          rating,
        }),
      });
      setResult(response);
      setPlaying(false);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      await onReviewed();
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Не удалось сохранить ответ");
    } finally {
      setSubmitting(null);
    }
  };

  const activeLine = useMemo(
    () => lesson.lines.findIndex((line) => elapsed >= line.startMs && elapsed < line.endMs),
    [elapsed, lesson.lines],
  );

  return (
    <main className="app-canvas lesson-canvas">
      <div className="mobile-shell lesson-shell">
        <header className="lesson-header">
          <button className="icon-button" onClick={onClose} aria-label="Вернуться"><ArrowLeft size={22} /></button>
          <div><span>БЛОК {lesson.block} · УРОК {lesson.number}</span><strong>{lesson.title}</strong></div>
          <button className="text-button" onClick={() => setTranslation((value) => !value)}>
            {translation ? "Скрыть" : "Перевод"}
          </button>
        </header>

        <section className="lesson-goal">
          <span>Цель урока</span>
          <p>{lesson.goal}</p>
        </section>

        <section className="dialogue-card" aria-label="Текст диалога">
          {lesson.audioStatus === "placeholder" && (
            <div className="audio-placeholder"><CircleAlert size={16} /><span><strong>Временная аудиозаглушка.</strong> Подсветка и плеер работают, речевой MP3 будет добавлен позже.</span></div>
          )}
          <div className="dialogue-lines">
            {lesson.lines.map((line, index) => {
              const state = index === activeLine ? "active" : elapsed >= line.endMs ? "past" : "future";
              return (
                <article key={line.id} className={`dialogue-line ${state}`}>
                  <span className="speaker" dir="rtl">{line.speaker}</span>
                  <p className="arabic-text" dir="rtl" lang="ar">{line.arabic}</p>
                  {translation && <p className="translation">{line.translation}</p>}
                </article>
              );
            })}
          </div>
        </section>

        {lesson.audioStatus === "ready" && (
          <audio
            ref={audioRef}
            src={lesson.audioUrl}
            preload="metadata"
            onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime * 1_000)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setListened(true); }}
          />
        )}

        <section className="player-card">
          <input
            className="timeline"
            type="range"
            min="0"
            max={lesson.durationMs}
            value={elapsed}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Позиция аудио"
            style={{ "--played": `${(elapsed / lesson.durationMs) * 100}%` } as React.CSSProperties}
          />
          <div className="time-row-player"><span>{formatClock(elapsed)}</span><span>{formatClock(lesson.durationMs)}</span></div>
          <div className="player-controls">
            <button onClick={() => seek(elapsed - 10_000)} aria-label="Назад на 10 секунд"><SkipBack size={22} /><small>10</small></button>
            <button onClick={() => void restart()} aria-label="Повторить сначала"><RefreshCcw size={21} /></button>
            <button className="main-play" onClick={() => void togglePlay()} aria-label={playing ? "Пауза" : "Воспроизвести"}>
              {playing ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}
            </button>
            <button onClick={() => seek(elapsed + 10_000)} aria-label="Вперёд на 10 секунд"><SkipForward size={22} /><small>10</small></button>
            <div className="speed-control" aria-label="Скорость воспроизведения">
              {[0.8, 1, 1.2].map((item) => (
                <button key={item} className={speed === item ? "active" : ""} onClick={() => setPlaybackSpeed(item)}>{item}×</button>
              ))}
            </div>
          </div>
        </section>

        <div className="lesson-actions">
          <button className="translation-toggle" onClick={() => setTranslation((value) => !value)}>
            <BookOpen size={18} /> {translation ? "Скрыть перевод" : "Показать перевод"}
          </button>
          <button
            className="translation-toggle"
            onClick={() => setAnalysisOpen((value) => !value)}
            aria-expanded={analysisOpen}
            aria-controls={`analysis-${lesson.id}`}
          >
            <BookMarked size={18} /> {analysisOpen ? "Скрыть разбор" : "Короткий разбор"}
            <ChevronDown className={analysisOpen ? "chevron-open" : ""} size={15} />
          </button>
        </div>

        {analysisOpen && (
          <section className="analysis-panel" id={`analysis-${lesson.id}`}>
            <p className="eyebrow">Короткий разбор</p>
            <div className="analysis-list">
              {lesson.shortAnalysis.map((item) => (
                <div className="analysis-item" key={`${lesson.id}-${item.arabic}`}>
                  <strong dir="rtl" lang="ar">{item.arabic}</strong>
                  <p>{item.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!listened && (
          <p className="listen-hint"><Headphones size={17} /> Дослушайте диалог, чтобы оценить понимание</p>
        )}

        {listened && !result && (
          <section className="review-panel">
            <div className="review-heading"><span><Check size={17} /></span><div><p className="eyebrow">Диалог прослушан</p><h2>Насколько хорошо вы поняли весь диалог на слух?</h2></div></div>
            {!preview && !previewError && <div className="calculating"><LoaderCircle className="spin" size={18} /> Готовим интервалы повторения…</div>}
            {previewError && <div className="inline-error">{previewError}<button onClick={() => { setPreviewError(""); setPreview(null); }}>Повторить</button></div>}
            {preview && (
              <>
                <p className="card-level-label">
                  {preview.masteryLevel === 1 ? "Новая карточка" : `Уровень карточки: ${preview.masteryLevel}`}
                </p>
                <div className="rating-grid">
                  {preview.options.map((option) => (
                    <button
                      key={option.key}
                      className={`rating-button ${option.key}`}
                      disabled={Boolean(submitting)}
                      onClick={() => void submitRating(option.key)}
                    >
                      <span>{submitting === option.key ? <LoaderCircle className="spin" size={17} /> : option.label}</span>
                      <strong>{option.intervalLabel}</strong>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {result && (
          <section className="success-panel">
            <div className="success-icon"><Check size={26} /></div>
            <p className="eyebrow">Ответ сохранён</p>
            <h2>Следующее повторение</h2>
            <strong>{formatDate(result.dueAt)}</strong>
            <p>Можно закрыть урок — прогресс уже сохранён.</p>
            <button className="primary-button" onClick={onClose}>Вернуться на главную</button>
          </section>
        )}
      </div>
    </main>
  );
}
