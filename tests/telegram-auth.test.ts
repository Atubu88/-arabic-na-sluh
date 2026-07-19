import assert from "node:assert/strict";
import test from "node:test";
import { validateTelegramInitData } from "../lib/telegram-auth";

async function signInitData(values: Record<string, string>, token: string) {
  const encoder = new TextEncoder();
  const importHmac = (key: BufferSource) => crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sign = async (key: BufferSource, value: string) => crypto.subtle.sign(
    "HMAC", await importHmac(key), encoder.encode(value),
  );
  const secret = await sign(encoder.encode("WebAppData"), token);
  const params = new URLSearchParams(values);
  const check = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const hash = [...new Uint8Array(await sign(secret, check))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return new URLSearchParams({ ...values, hash }).toString();
}

test("validates Telegram initData and reads identity only from signed payload", async () => {
  const now = new Date();
  const token = "123456:test-token";
  const initData = await signInitData({
    auth_date: String(Math.floor(now.getTime() / 1000)),
    query_id: "AAEAA-test",
    user: JSON.stringify({ id: 778899, first_name: "Ахмад", language_code: "ru" }),
  }, token);
  const user = await validateTelegramInitData(initData, token, 86_400, now);
  assert.equal(user.id, 778899);
  assert.equal(user.first_name, "Ахмад");
});

test("rejects tampered and expired Telegram initData", async () => {
  const now = new Date();
  const token = "123456:test-token";
  const initData = await signInitData({
    auth_date: String(Math.floor(now.getTime() / 1000) - 90_000),
    user: JSON.stringify({ id: 1, first_name: "Test" }),
  }, token);
  await assert.rejects(() => validateTelegramInitData(initData, token, 86_400, now));
  await assert.rejects(() => validateTelegramInitData(initData, `${token}-wrong`, 200_000, now));
});
