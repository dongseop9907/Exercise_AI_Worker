import { createClient } from "@supabase/supabase-js";
import type { Env } from "../types";

export function createSupabaseAdmin(env: Env) {
  if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL 환경변수가 없습니다.");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}