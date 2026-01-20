import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../supabaseClient";
import { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  role: "admin" | "client";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  addCredits: (amount: number) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérification initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email!);
      else setLoading(false);
    });

    // 2. Écoute des changements (connexion/déconnexion)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      // ÉTAPE A : On récupère les CRÉDITS (Table profiles)
      // Note: Lovable utilise 'user_id' au lieu de 'id' pour la liaison
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", userId)
        .maybeSingle(); // maybeSingle évite les erreurs si pas de profil

      if (profileError) console.error("Erreur crédits:", profileError);

      // ÉTAPE B : On récupère le RÔLE (Table user_roles)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) console.error("Erreur rôle:", roleError);

      // ÉTAPE C : On assemble tout
      setUser({
        id: userId,
        email: email,
        name: email.split("@")[0],
        credits: profileData?.credits ?? 0, // Si vide, 0
        role: roleData?.role === "admin" ? "admin" : "client", // Si vide, client
      });
    } catch (error) {
      console.error("Erreur générale:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    const newCredits = user.credits + amount;
    setUser({ ...user, credits: newCredits });

    // Mise à jour compatible avec la structure Lovable (user_id)
    await supabase.from("profiles").update({ credits: newCredits }).eq("user_id", user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        addCredits,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
