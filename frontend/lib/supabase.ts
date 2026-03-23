import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Service-role client — used in API routes only (bypasses RLS)
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser
// Check if we are on the server before initializing to avoid browser errors
export const supabase = typeof window === 'undefined'
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null as any;

// Browser / anon client — used for Supabase Auth in the browser
// Only the anon key is exposed publicly (safe)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
