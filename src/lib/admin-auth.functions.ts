import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { readServerSupabaseEnv } from "./supabase-env.server";
import { readEnv } from "./worker-env.server";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function serverAdmin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = readServerSupabaseEnv();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Server misconfigured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Sign in through the server so admin auth works even when client Supabase env is missing on Vercel. */
export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().email(), password: z.string().min(6) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = readServerSupabaseEnv();
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error(
        "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel.",
      );
    }

    const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    });

    const { data: authData, error } = await authClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw new Error(error.message);
    if (!authData.session || !authData.user) throw new Error("Sign in failed.");

    const { data: role, error: roleError } = await serverAdmin()
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw new Error(roleError.message);
    if (!role) throw new Error("Access denied. Your account is not authorized as an admin.");

    return {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    };
  });

/** One-time admin bootstrap using ADMIN_EMAIL + ADMIN_PASSWORD + ADMIN_SETUP_SECRET on the server. */
export const bootstrapAdminFromEnv = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ secret: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const expectedSecret = readEnv("ADMIN_SETUP_SECRET");
    if (!expectedSecret || data.secret !== expectedSecret) {
      throw new Error("Unauthorized.");
    }

    const email = readEnv("ADMIN_EMAIL")?.trim().toLowerCase();
    const password = readEnv("ADMIN_PASSWORD");
    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set on the server.");
    }

    const supabase = serverAdmin();
    let userId: string | undefined;

    let page = 1;
    while (!userId) {
      const { data: listed, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const existing = listed.users.find((user) => user.email?.toLowerCase() === email);
      if (existing) {
        userId = existing.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updateError) throw updateError;
      } else if (listed.users.length < 200) {
        break;
      } else {
        page += 1;
      }
    }

    if (!userId) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "NIFES CUSTECH Admin" },
      });
      if (error) throw error;
      userId = created.user.id;
    }

    const { data: role } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
      if (roleError) throw roleError;
    }

    return { ok: true as const, email };
  });
