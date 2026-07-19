import type { AppEnv } from "./env";

let activeEnv: AppEnv | null = null;

/**
 * Vinext routes execute in the same Worker isolate as the fetch entrypoint.
 * The entrypoint records Cloudflare bindings before delegating the request.
 */
export function setRuntimeEnv(env: AppEnv) {
  activeEnv = env;
}

export function getRuntimeEnv() {
  if (!activeEnv) throw new Error("Cloudflare runtime environment is unavailable");
  return activeEnv;
}
