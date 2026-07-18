import { readEnv, readEnvAny } from "./worker-env";

declare global {
  interface Window {
    __FYB_PUBLIC_ENV__?: {
      SUPABASE_URL?: string;
      SUPABASE_PUBLISHABLE_KEY?: string;
      SUPABASE_PROJECT_ID?: string;
    };
  }
}

export function normalizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  if (trimmed.includes(".supabase.co")) {
    return `https://${trimmed.replace(/^\/\//, "")}`.replace(/\/$/, "");
  }
  if (/^[a-z0-9-]+$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }
  return trimmed;
}

function urlFromProjectId(projectId: string | undefined): string | undefined {
  if (!projectId?.trim()) return undefined;
  return normalizeSupabaseUrl(projectId.trim());
}

function readMeta(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? undefined;
}

export function readPublicSupabaseEnv() {
  const fromMeta = {
    SUPABASE_URL: readMeta("fyb-public-supabase-url"),
    SUPABASE_PUBLISHABLE_KEY: readMeta("fyb-public-supabase-key"),
  };
  const fromWindow =
    typeof window !== "undefined" ? window.__FYB_PUBLIC_ENV__ : undefined;

  const rawUrl =
    fromMeta.SUPABASE_URL ||
    fromWindow?.SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    readEnv("SUPABASE_URL") ||
    urlFromProjectId(
      fromWindow?.SUPABASE_PROJECT_ID ||
        import.meta.env.VITE_SUPABASE_PROJECT_ID ||
        readEnv("SUPABASE_PROJECT_ID"),
    );

  const rawKey =
    fromMeta.SUPABASE_PUBLISHABLE_KEY ||
    fromWindow?.SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    readEnv("SUPABASE_PUBLISHABLE_KEY");

  return {
    SUPABASE_URL: normalizeSupabaseUrl(rawUrl),
    SUPABASE_PUBLISHABLE_KEY: rawKey?.trim() || undefined,
  };
}

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
