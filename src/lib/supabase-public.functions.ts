import { createServerFn } from "@tanstack/react-start";
import { publicSupabaseHeadMeta } from "./supabase-env.server";

export const fetchPublicSupabaseHeadMeta = createServerFn().handler(() => {
  return publicSupabaseHeadMeta();
});
