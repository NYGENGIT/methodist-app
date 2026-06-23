// ─────────────────────────────────────────────────────────────────────────────
//  EDIT THIS FILE after creating your free Supabase project (see SETUP_GUIDE.md).
//  Paste the two values from  Supabase → Project Settings → API.
//  Until you do, the public dashboard still works fully; only the login/tracker
//  is disabled and shows a friendly "not connected yet" message.
// ─────────────────────────────────────────────────────────────────────────────
export const SUPABASE_URL = 'https://lysbfmhiranugphwrbcd.supabase.co';        // e.g. https://abcd1234.supabase.co
export const SUPABASE_ANON_KEY = 'sb_publishable_N3QI920RyNSWBQDl9kiXvA_z67K2oZS';

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');

export const ORG = {
  name: 'Donewell Insurance Ltd',
  tagline: 'If it must be done, it must be Donewell',
};
