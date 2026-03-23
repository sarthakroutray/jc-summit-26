import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Verify an incoming admin request.
 *
 * Strategy:
 *  1. Require a Supabase JWT in the Authorization header
 *  2. Verify the user is in admin_users table
 *
 * Returns null if authorized, or a string describing the failure.
 */
export async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return 'Missing or invalid Authorization header';
  }

  const token = authHeader.slice(7);

  // Create a user-scoped client with the JWT — this respects RLS
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // Verify the user is authenticated
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return 'Invalid or expired token';

  // Verify the user is in admin_users
  const { data: adminRow } = await userClient
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminRow) return 'User is not an admin';
  return null;
}
