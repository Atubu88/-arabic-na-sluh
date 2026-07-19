import { lessons } from "@/content/lessons";
import { ensureSchema, getD1, upsertUser, type CardRow } from "@/lib/db";
import { apiError, authenticateRequest } from "@/lib/request-auth";
import type { DashboardData, RatingKey } from "@/lib/types";

export const dynamic = "force-dynamic";

function calculateStreak(reviewedAt: string[]) {
  const days = new Set(reviewedAt.map((value) => value.slice(0, 10)));
  const cursor = new Date();
  let streak = 0;
  while (true) {
    const day = cursor.toISOString().slice(0, 10);
    if (!days.has(day)) {
      if (streak === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const yesterday = cursor.toISOString().slice(0, 10);
        if (!days.has(yesterday)) return 0;
      } else {
        break;
      }
    } else {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }
  return streak;
}

export async function GET(request: Request) {
  try {
    const identity = await authenticateRequest(request);
    const db = getD1();
    await ensureSchema(db);
    await upsertUser(db, identity);

    const [cardsResult, settings, reviewsResult] = await Promise.all([
      db.prepare("SELECT * FROM lesson_cards WHERE user_id = ? ORDER BY lesson_id")
        .bind(identity.userId)
        .all<CardRow>(),
      db.prepare(
        "SELECT enabled, time_local, timezone_offset_minutes FROM notification_settings WHERE user_id = ?",
      ).bind(identity.userId).first<{
        enabled: number;
        time_local: string;
        timezone_offset_minutes: number;
      }>(),
      db.prepare("SELECT lesson_id, reviewed_at FROM review_history WHERE user_id = ? ORDER BY reviewed_at DESC")
        .bind(identity.userId)
        .all<{ lesson_id: string; reviewed_at: string }>(),
    ]);

    const activeLessonIds = new Set(lessons.map((lesson) => lesson.id));
    const cards = cardsResult.results.filter((card) => activeLessonIds.has(card.lesson_id));
    const reviews = reviewsResult.results.filter((review) => activeLessonIds.has(review.lesson_id));
    const now = new Date();
    const dueCards = cards.filter((card) => card.state !== 0 && new Date(card.due_at) <= now);
    const newCards = cards.filter((card) => card.state === 0);
    const recommended = dueCards[0] ?? newCards[0] ?? [...cards].sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
    const learnedCards = cards.filter((card) => card.state !== 0);
    const nextDue = learnedCards
      .map((card) => card.due_at)
      .sort((a, b) => a.localeCompare(b))[0] ?? null;

    const payload: DashboardData = {
      user: { firstName: identity.firstName, isDemo: identity.isDemo },
      lessons,
      cards: cards.map((card) => ({
        lessonId: card.lesson_id,
        state: card.state,
        dueAt: card.due_at,
        lastRating: card.last_rating as RatingKey | null,
        reps: card.reps,
        lapses: card.lapses,
        revision: card.revision,
      })),
      recommendedLessonId: recommended?.lesson_id ?? lessons[0]?.id ?? "",
      dueToday: dueCards.length,
      newLessons: newCards.length,
      progress: {
        learnedLessons: learnedCards.length,
        totalReviews: reviews.length,
        streakDays: calculateStreak(reviews.map((row) => row.reviewed_at)),
        nextDueAt: nextDue,
      },
      settings: {
        enabled: Boolean(settings?.enabled ?? 1),
        timeLocal: settings?.time_local ?? "19:00",
        timezoneOffsetMinutes: settings?.timezone_offset_minutes ?? 0,
      },
    };

    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
