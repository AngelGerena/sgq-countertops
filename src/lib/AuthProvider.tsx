import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AdminUser } from './types';

interface AuthShape {
  session: Session | null;
  admin: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthShape>({
  session: null, admin: null, loading: true,
  signIn: async () => ({ error: 'not ready' }),
  signOut: async () => {}
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAdmin(userId: string | undefined) {
    if (!userId) { setAdmin(null); return; }
    const { data, error } = await supabase
      .from('admin_users')
      .select('id,user_id,email,full_name,role,is_super_admin')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) { console.error('admin lookup failed:', error.message); setAdmin(null); return; }
    setAdmin((data as AdminUser) ?? null);
  }

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadAdmin(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      await loadAdmin(s?.user.id);
      setLoading(false);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const value: AuthShape = {
    session, admin, loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    },
    async signOut() {
      await supabase.auth.signOut();
      setAdmin(null);
    }
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
