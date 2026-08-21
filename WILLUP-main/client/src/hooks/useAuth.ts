import { useState, useEffect, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { USE_MOCK_BACKEND } from '../lib/mockConfig';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let mounted = true;

    if (USE_MOCK_BACKEND) {
      setTimeout(() => {
        if (!mounted) return;
        const isAdmin = localStorage.getItem('mock_admin_mode') === 'true';
        const mockUser: any = { 
          id: isAdmin ? 'mock-admin-1' : 'mock-student-1', 
          email: isAdmin ? 'admin@demo.com' : 'student@demo.com' 
        };
        setSession({ access_token: 'mock-token', user: mockUser } as any);
        setUser(mockUser);
        setLoading(false);
      }, 500);
      return () => { mounted = false; };
    }

    // 1. Fetch initial active session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError);
      } else {
        if (initialSession?.access_token) {
          supabase.realtime.setAuth(initialSession.access_token);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      }
      setLoading(false);
    });

    // 2. Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        if (currentSession?.access_token) {
          supabase.realtime.setAuth(currentSession.access_token);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    if (USE_MOCK_BACKEND) {
      return new Promise((resolve) => setTimeout(() => {
        const isAdmin = localStorage.getItem('mock_admin_mode') === 'true';
        const mockUser: any = { id: isAdmin ? 'mock-admin-1' : 'mock-student-1', email };
        setSession({ access_token: 'mock-token', user: mockUser } as any);
        setUser(mockUser);
        setLoading(false);
        resolve({ session: { access_token: 'mock-token', user: mockUser }, user: mockUser });
      }, 800));
    }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError);
      setLoading(false);
      throw signInError;
    }
    if (data.session?.access_token) {
      supabase.realtime.setAuth(data.session.access_token);
    }
    setSession(data.session);
    setUser(data.user);
    setLoading(false);
    return data;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (USE_MOCK_BACKEND) {
      return new Promise((resolve) => setTimeout(() => {
        setSession(null);
        setUser(null);
        setLoading(false);
        resolve(undefined);
      }, 500));
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError);
      setLoading(false);
      throw signOutError;
    }
    setSession(null);
    setUser(null);
    setLoading(false);
  }, []);

  return {
    session,
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!session,
  };
}

export default useAuth;
