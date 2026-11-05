import { getLesson } from "@/content/lessons";
import { ensureSchema, getCard, getD1, storedCardFromRow, upsertUser } from "@/lib/db";
import { calculateOptions, publicOptions } from "@/lib/fsrs";
import { apiError, authenticateRequest, HttpError } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;
    if (!getLesson(lessonId)) throw new HttpError(404, "Урок не найден");
    const identity = await authenticateRequest(request);
    const db = getD1();
    await ensureSchema(db);
    await upsertUser(db, identity);
    const card = await getCard(db, identity.userId, lessonId);
    if (!card) throw new HttpError(404, "Карточка урока не найдена");

    const calculatedAt = new Date();
    const options = calculateOptions(storedCardFromRow(card), calculatedAt);
    const attemptId = crypto.randomUUID();
    const expiresAt = new Date(calculatedAt.getTime() + 15 * 60_000).toISOString();

    await db.batch([
      db.prepare(
        `INSERT INTO review_attempts
         (attempt_id, user_id, lesson_id, base_revision, calculated_at, expires_at, options_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        attemptId,
        identity.userId,
        lessonId,
        card.revision,
        calculatedAt.toISOString(),
        expiresAt,
        JSON.stringify(options),
      ),
      db.prepare("DELETE FROM review_attempts WHERE expires_at < ?")
        .bind(new Date(calculatedAt.getTime() - 86_400_000).toISOString()),
    ]);

    return Response.json({
      attemptId,
      calculatedAt: calculatedAt.toISOString(),
      options: publicOptions(options, calculatedAt),
    });
  } catch (error) {
    return apiError(error);
  }
}
