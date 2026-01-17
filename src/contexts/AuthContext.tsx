import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  credits: number; // On s'assure qu'il a des crédits
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  addCredits: (amount: number) => void; // Nouvelle fonction
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Au chargement, on vérifie si un utilisateur est déjà sauvegardé
  useEffect(() => {
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Utilisateur par défaut pour la démo (si vide)
      setUser({ name: "Client Démo", email: "client@latruffe.com", credits: 5 });
    }
  }, []);

  const login = (email: string) => {
    const newUser = { name: "Client Connecté", email, credits: 0 };
    setUser(newUser);
    localStorage.setItem("user_data", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user_data");
  };

  // ✅ LA FONCTION MAGIQUE
  const addCredits = (amount: number) => {
    if (user) {
      const updatedUser = { ...user, credits: user.credits + amount };
      setUser(updatedUser);
      // On sauvegarde le nouveau solde pour ne pas le perdre
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      console.log(`🤑 Ajout de ${amount} crédits. Nouveau solde : ${updatedUser.credits}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addCredits, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};