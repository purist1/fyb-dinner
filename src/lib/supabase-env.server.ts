import { normalizeSupabaseUrl } from "./supabase-env";
import { readEnv, readEnvAny } from "./worker-env.server";

export function readPublicSupabaseEnvFromProcess() {
  const rawUrl = readEnvAny([
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
    "SUPABASE_PROJECT_ID",
    "VITE_SUPABASE_PROJECT_ID",
  ]);

  const rawKey = readEnvAny([
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ]);

  return {
    SUPABASE_URL: normalizeSupabaseUrl(rawUrl),
    SUPABASE_PUBLISHABLE_KEY: rawKey,
  };
}

export function readServerSupabaseEnv() {
  const rawUrl = readEnvAny([
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
    "SUPABASE_PROJECT_ID",
    "VITE_SUPABASE_PROJECT_ID",
  ]);

  return {
    SUPABASE_URL: normalizeSupabaseUrl(rawUrl),
    SUPABASE_PUBLISHABLE_KEY: readEnvAny([
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ]),
    SUPABASE_SERVICE_ROLE_KEY: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function publicSupabaseHeadMeta(): Array<{ name: string; content: string }> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = readPublicSupabaseEnvFromProcess();
  const meta: Array<{ name: string; content: string }> = [];
  if (SUPABASE_URL) meta.push({ name: "fyb-public-supabase-url", content: SUPABASE_URL });
  if (SUPABASE_PUBLISHABLE_KEY) {
    meta.push({ name: "fyb-public-supabase-key", content: SUPABASE_PUBLISHABLE_KEY });
  }
  return meta;
}
