import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProRouteProps {
  children: ReactNode;
}

export const ProRoute = ({ children }: ProRouteProps) => {
  const { user, isLoading, isRoleLoading, isPro } = useAuth();

  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500" />
          <p className="text-slate-400">Vérification de l'accès Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?message=Connectez-vous%20pour%20acc%C3%A9der%20%C3%A0%20La%20Truffe%20Pro" replace />;
  }

  if (!isPro) {
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
};
