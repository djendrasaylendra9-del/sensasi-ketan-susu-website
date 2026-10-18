import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey && !url.includes("YOUR_PROJECT") && !anonKey.includes("YOUR_"));

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
