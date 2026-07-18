/**
 * Server-only env access for Cloudflare Workers.
 * Use dynamic process.env[key] — static process.env.FOO is inlined as {} at build time.
 */

export function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name];
  return value?.trim() || undefined;
}

export function readEnvAny(names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return undefined;
}
