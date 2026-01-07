import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Wait a bit for isAdmin to be determined after auth loads
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isAdmin]);

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

  // If admin, show content
  if (isAdmin) {
    return <>{children}</>;
  }

  // Wait for admin check to complete before redirecting
  if (!shouldRedirect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification des accès admin...</p>
        </div>
      </div>
    );
  }

  // If logged in but not admin after waiting, redirect to client dashboard
  return <Navigate to="/client-dashboard" replace />;
};
