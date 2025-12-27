import { createClient } from "@supabase/supabase-js";

export function getSupabase(env: any) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  return createClient(env.SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

export function getSupabaseSchema(env: any, schema: string) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  return createClient(env.SUPABASE_URL, key, {
    auth: { persistSession: false },
    db: { schema },
  });
}
