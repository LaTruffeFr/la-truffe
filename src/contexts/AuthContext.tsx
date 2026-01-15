import React, { createContext, useContext, useState, useEffect } from 'react';

// Définition du profil utilisateur
interface User {
  email: string;
  name: string;
  type: string;
  credits: number;
  initials: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 1. Vérifier au chargement de la page si une session existe
  useEffect(() => {
    const storedAuth = localStorage.getItem('laTruffe_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUser({
        email: "n_e_z_o_62860@outlook.com",
        name: "Client La Truffe",
        type: "Individuel",
        credits: 0,
        initials: "NE"
      });
    }
  }, []);

  // 2. Fonction de Connexion
  const login = (email: string) => {
    localStorage.setItem('laTruffe_auth', 'true');
    setIsAuthenticated(true);
    setUser({
      email: email || "n_e_z_o_62860@outlook.com",
      name: "Client La Truffe",
      type: "Individuel",
      credits: 0,
      initials: "NE"
    });
  };

  // 3. Fonction de Déconnexion
  const logout = () => {
    localStorage.removeItem('laTruffe_auth');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser l'auth partout
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};