import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'client';

interface AuthContextType {
  user: User | null;
  session: Session | null;

  /** True only while resolving initial session (getSession). */
  isLoading: boolean;
  /** True while resolving role for a logged-in user. */
  isRoleLoading: boolean;

  role: AppRole | null;
  isAdmin: boolean;

  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(fallback), ms);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutId) window.clearTimeout(timeoutId);
  return result;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);

  const initialCheckDone = useRef(false);

  const fetchIsAdmin = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return !!data;
  }, []);

  const resolveRoleForUser = useCallback(
    async (u: User | null) => {
      if (!u) {
        setRole(null);
        setIsRoleLoading(false);
        return;
      }

      // IMPORTANT: while role is unknown, DO NOT redirect. App.tsx will show a spinner.
      setIsRoleLoading(true);
      setRole(null);

      // If role query fails/blocked by RLS, we must not freeze the app.
      const isAdmin = await withTimeout(fetchIsAdmin(u.id), 4000, false);
      setRole(isAdmin ? 'admin' : 'client');
      setIsRoleLoading(false);
    },
    [fetchIsAdmin]
  );

  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (!mounted) return;

        const s = data.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);

        // Resolve role (non-blocking for isLoading termination)
        await resolveRoleForUser(s?.user ?? null);
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Do not block UI updates; role resolves async
      void resolveRoleForUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveRoleForUser]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    setRole(null);
    setIsRoleLoading(false);
    await supabase.auth.signOut();
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isRoleLoading,
        role,
        isAdmin,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
