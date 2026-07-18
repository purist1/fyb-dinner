/**
 * Read Worker / server environment variables at request time.
 * Avoid `process.env.FOO` — Vite inlines static access at build time as `{}` on Cloudflare.
 */

type EnvRecord = Record<string, string | undefined>;

function readProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name];
  return value?.trim() || undefined;
}

function readCloudflareEnv(name: string): string | undefined {
  try {
    // Resolved at runtime on Cloudflare Workers only.
    const { env } = require("cloudflare:workers") as { env: EnvRecord };
    const value = env[name];
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Read a single env var from Cloudflare bindings or process.env (dynamic access). */
export function readEnv(name: string): string | undefined {
  return readCloudflareEnv(name) ?? readProcessEnv(name);
}

export function readEnvAny(names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return undefined;
}
