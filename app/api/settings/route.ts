import { ensureSchema, getD1, upsertUser } from "@/lib/db";
import { apiError, authenticateRequest, HttpError } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const identity = await authenticateRequest(request);
    const body = (await request.json()) as {
      enabled?: boolean;
      timeLocal?: string;
      timezoneOffsetMinutes?: number;
    };
    if (
      typeof body.enabled !== "boolean" ||
      !body.timeLocal ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.timeLocal) ||
      !Number.isInteger(body.timezoneOffsetMinutes) ||
      Math.abs(body.timezoneOffsetMinutes ?? 0) > 14 * 60
    ) {
      throw new HttpError(400, "Некорректные настройки уведомлений");
    }
    const db = getD1();
    await ensureSchema(db);
    await upsertUser(db, identity);
    await db.prepare(
      `UPDATE notification_settings SET
        enabled = ?, time_local = ?, timezone_offset_minutes = ?, updated_at = ?
       WHERE user_id = ?`,
    ).bind(
      body.enabled ? 1 : 0,
      body.timeLocal,
      body.timezoneOffsetMinutes,
      new Date().toISOString(),
      identity.userId,
    ).run();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
