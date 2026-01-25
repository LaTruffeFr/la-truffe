import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'client';

interface UserProfile {
  credits: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;

  /** True only while resolving initial session (getSession). */
  isLoading: boolean;
  /** True while resolving role for a logged-in user. */
  isRoleLoading: boolean;

  role: AppRole | null;
  isAdmin: boolean;
  credits: number;
  userEmail: string | null;

  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
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
  const [credits, setCredits] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }, []);

  const resolveRoleForUser = useCallback(
    async (u: User | null) => {
      if (!u) {
        setRole(null);
        setCredits(0);
        setUserEmail(null);
        setIsRoleLoading(false);
        return;
      }

      // IMPORTANT: while role is unknown, DO NOT redirect. App.tsx will show a spinner.
      setIsRoleLoading(true);
      setRole(null);

      // Fetch admin status and profile in parallel
      const [isAdmin, profile] = await Promise.all([
        withTimeout(fetchIsAdmin(u.id), 4000, false),
        withTimeout(fetchProfile(u.id), 4000, null)
      ]);

      setRole(isAdmin ? 'admin' : 'client');
      setCredits(profile?.credits ?? 0);
      setUserEmail(profile?.email ?? u.email ?? null);
      setIsRoleLoading(false);
    },
    [fetchIsAdmin, fetchProfile]
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
    setCredits(0);
    setUserEmail(null);
    setIsRoleLoading(false);
    await supabase.auth.signOut();
  };

  const refreshCredits = useCallback(async () => {
    if (!user) return;
    const profile = await fetchProfile(user.id);
    if (profile) {
      setCredits(profile.credits);
    }
  }, [user, fetchProfile]);

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
        credits,
        userEmail,
        signUp,
        signIn,
        signOut,
        refreshCredits,
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
