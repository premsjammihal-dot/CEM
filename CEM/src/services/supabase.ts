/**
 * Supabase adapter — MIGRATION PATH.
 *
 * The app ships with a fully-working local backend (services/db.ts) so every
 * module runs offline. To move to production:
 *
 *   1. `npm install @supabase/supabase-js`
 *   2. Copy .env.example to .env and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *      (NEVER expose the service_role key in client code).
 *   3. Run supabase/migrations/0001_init.sql and supabase/seed.sql.
 *   4. Replace the internals of each services/*.ts function with the typed
 *      Supabase queries documented below (signatures stay identical, so no
 *      component changes are required).
 *
 * Example — auth.login:
 *   const { error } = await supabase.auth.signInWithPassword({ email, password });
 *
 * Example — events.listPublished:
 *   const { data } = await supabase.from('events').select('*').eq('status', 'published');
 *
 * RLS policies in the migration enforce every role rule server-side, so the
 * client never needs secrets.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// import { createClient } from "@supabase/supabase-js";
// export const supabase = supabaseConfigured
//   ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
//   : null;
