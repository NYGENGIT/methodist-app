'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Profile } from './types';

export interface AuthState {
  loading: boolean;
  email: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (uid: string, mail: string) => {
    const sb = supabase();
    if (!sb) return;
    const { data } = await sb.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data as Profile);
    else setProfile({ id: uid, email: mail, full_name: mail, role: 'manager', branches: [] });
  }, []);

  const refresh = useCallback(async () => {
    const sb = supabase();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb.auth.getSession();
    const session = data.session;
    if (session?.user) {
      setEmail(session.user.email ?? null);
      await loadProfile(session.user.id, session.user.email ?? '');
    } else {
      setEmail(null); setProfile(null);
    }
    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    refresh();
    const sb = supabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setEmail(session.user.email ?? null); loadProfile(session.user.id, session.user.email ?? ''); }
      else { setEmail(null); setProfile(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh, loadProfile]);

  const signIn = useCallback(async (mail: string, password: string) => {
    const sb = supabase();
    if (!sb) return 'Login is not connected yet.';
    const { error } = await sb.auth.signInWithPassword({ email: mail.trim(), password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    const sb = supabase();
    if (sb) await sb.auth.signOut();
    setEmail(null); setProfile(null);
  }, []);

  return { loading, email, profile, isAdmin: profile?.role === 'admin', signIn, signOut, refresh };
}
