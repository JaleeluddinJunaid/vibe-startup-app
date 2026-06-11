import { createClient } from "@supabase/supabase-js";

// These come from your .env (local) and Vercel env vars (production).
// The anon key is the PUBLIC key — it's designed to be used in frontend code, so it's safe here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file (and to Vercel)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);