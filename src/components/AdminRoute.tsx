import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();

  // Show loading only during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If admin, show content immediately
  if (isAdmin) {
    return <>{children}</>;
  }

  // If logged in but not admin, redirect to client dashboard
  return <Navigate to="/client-dashboard" replace />;
};
