import { getLesson } from "@/content/lessons";
import { ensureSchema, getCard, getD1, upsertUser } from "@/lib/db";
import type { StoredSchedulingOption } from "@/lib/fsrs";
import { apiError, authenticateRequest, HttpError } from "@/lib/request-auth";
import type { RatingKey } from "@/lib/types";

export const dynamic = "force-dynamic";

type AttemptRow = {
  attempt_id: string;
  user_id: string;
  lesson_id: string;
  base_revision: number;
  calculated_at: string;
  expires_at: string;
  options_json: string;
};

type ExistingOutcomeRow = { outcome_json: string };

const ratingKeys = new Set<RatingKey>(["again", "hard", "good", "easy"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    if (!getLesson(lessonId)) throw new HttpError(404, "Урок не найден");
    const body = (await request.json()) as {
      attemptId?: string;
      requestId?: string;
      rating?: RatingKey;
    };
    if (!body.attemptId || !body.requestId || !body.rating || !ratingKeys.has(body.rating)) {
      throw new HttpError(400, "Некорректный ответ урока");
    }
    if (!/^[0-9a-f-]{36}$/i.test(body.attemptId) || !/^[0-9a-f-]{36}$/i.test(body.requestId)) {
      throw new HttpError(400, "Некорректный идентификатор ответа");
    }

    const identity = await authenticateRequest(request);
    const db = getD1();
    await ensureSchema(db);
    await upsertUser(db, identity);

    const duplicate = await db.prepare(
      "SELECT outcome_json FROM review_history WHERE attempt_id = ? OR request_id = ? LIMIT 1",
    ).bind(body.attemptId, body.requestId).first<ExistingOutcomeRow>();
    if (duplicate) {
      return Response.json({ ...JSON.parse(duplicate.outcome_json), idempotent: true });
    }

    const attempt = await db.prepare(
      "SELECT * FROM review_attempts WHERE attempt_id = ? AND user_id = ? AND lesson_id = ?",
    ).bind(body.attemptId, identity.userId, lessonId).first<AttemptRow>();
    if (!attempt) throw new HttpError(404, "Попытка оценки не найдена");
    if (new Date(attempt.expires_at) < new Date()) {
      throw new HttpError(409, "Варианты интервалов устарели. Откройте оценку заново.");
    }

    const card = await getCard(db, identity.userId, lessonId);
    if (!card) throw new HttpError(404, "Карточка урока не найдена");
    if (card.revision !== attempt.base_revision) {
      throw new HttpError(409, "Этот урок уже был оценён в другой вкладке");
    }

    const options = JSON.parse(attempt.options_json) as StoredSchedulingOption[];
    const selected = options.find((option) => option.key === body.rating);
    if (!selected) throw new HttpError(400, "Вариант FSRS не найден");

    const reviewedAt = new Date().toISOString();
    const historyId = crypto.randomUUID();
    const outcome = {
      lessonId,
      rating: body.rating,
      dueAt: selected.card.dueAt,
      reviewedAt,
      state: selected.card.state,
      reps: selected.card.reps,
      lapses: selected.card.lapses,
      revision: card.revision + 1,
    };

    try {
      await db.batch([
        db.prepare(
          `INSERT INTO review_history (
            id, request_id, attempt_id, user_id, lesson_id, base_revision, rating,
            reviewed_at, due_at_before, due_at_after, state_before, state_after, outcome_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          historyId,
          body.requestId,
          body.attemptId,
          identity.userId,
          lessonId,
          card.revision,
          body.rating,
          reviewedAt,
          card.due_at,
          selected.card.dueAt,
          card.state,
          selected.card.state,
          JSON.stringify(outcome),
        ),
        db.prepare(
          `UPDATE lesson_cards SET
            due_at = ?, stability = ?, difficulty = ?, elapsed_days = ?,
            scheduled_days = ?, learning_steps = ?, reps = ?, lapses = ?,
            state = ?, last_review = ?, last_rating = ?, revision = revision + 1,
            updated_at = ?
          WHERE user_id = ? AND lesson_id = ? AND revision = ?`,
        ).bind(
          selected.card.dueAt,
          selected.card.stability,
          selected.card.difficulty,
          selected.card.elapsedDays,
          selected.card.scheduledDays,
          selected.card.learningSteps,
          selected.card.reps,
          selected.card.lapses,
          selected.card.state,
          selected.card.lastReview,
          body.rating,
          reviewedAt,
          identity.userId,
          lessonId,
          card.revision,
        ),
      ]);
    } catch (error) {
      const existing = await db.prepare(
        `SELECT outcome_json FROM review_history
         WHERE attempt_id = ? OR request_id = ? OR
         (user_id = ? AND lesson_id = ? AND base_revision = ?)
         LIMIT 1`,
      ).bind(
        body.attemptId,
        body.requestId,
        identity.userId,
        lessonId,
        card.revision,
      ).first<ExistingOutcomeRow>();
      if (existing) {
        return Response.json({ ...JSON.parse(existing.outcome_json), idempotent: true });
      }
      throw error;
    }

    return Response.json(outcome);
  } catch (error) {
    return apiError(error);
  }
}
