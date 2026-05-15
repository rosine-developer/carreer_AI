import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SESSION_TIMEOUT_MS  = 30 * 60 * 1000; // 30 minutes → auto logout
const SESSION_WARNING_MS  = 28 * 60 * 1000; // 28 minutes → show warning banner

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionTimeoutWarning: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null);
  const [session, setSession]                   = useState<Session | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clear both timers ──────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current)  clearTimeout(logoutTimerRef.current);
    setSessionTimeoutWarning(false);
  }, []);

  // ── Sign-out (also clears timers) ──────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    clearTimers();
    await supabase.auth.signOut();
  }, [clearTimers]);

  // ── Reset inactivity timer ─────────────────────────────────────────────────
  const resetSessionTimer = useCallback(() => {
    clearTimers();
    warningTimerRef.current = setTimeout(() => {
      setSessionTimeoutWarning(true);
    }, SESSION_WARNING_MS);
    logoutTimerRef.current = setTimeout(() => {
      handleSignOut();
    }, SESSION_TIMEOUT_MS);
  }, [clearTimers, handleSignOut]);

  // ── Bootstrap auth state ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) resetSessionTimer();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        resetSessionTimer();
      } else {
        clearTimers();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track user activity to reset the inactivity timer ─────────────────────
  useEffect(() => {
    if (!user) return;
    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    const handleActivity = () => resetSessionTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
  }, [user, resetSessionTimer]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        sessionTimeoutWarning,
        signUp,
        signIn,
        signInWithGoogle,
        signOut: handleSignOut,
        resetSessionTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
