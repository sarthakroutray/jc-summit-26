'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if authenticated user is in admin_users table
  const checkAdminStatus = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('id', currentUser.id)
      .maybeSingle();

    setIsAdmin(!error && !!data);
  }, []);

  useEffect(() => {
    // Get current session on mount
    supabaseClient.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      await checkAdminStatus(s?.user ?? null);
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        await checkAdminStatus(s?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      return error;
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
  }, []);

  // Get the access token to pass as Authorization header to admin API routes
  const getAuthHeader = useCallback((): Record<string, string> => {
    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  }, [session]);

  return {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signOut,
    getAuthHeader,
  };
}
