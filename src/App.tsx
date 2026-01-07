import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { VehicleDataProvider } from "@/contexts/VehicleDataContext";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Protected route for authenticated users (clients)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isRoleLoading, isAdmin } = useAuth();

  // Show loading while checking auth/role
  if (isLoading || (user && isRoleLoading)) {
    return <LoadingSpinner />;
  }

  // Not logged in -> redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin trying to access client route -> redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin route - only for admins
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isRoleLoading, isAdmin } = useAuth();

  // Show loading while checking auth/role
  if (isLoading || (user && isRoleLoading)) {
    return <LoadingSpinner />;
  }

  // Not logged in -> redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Not admin -> redirect to client dashboard
  if (!isAdmin) {
    return <Navigate to="/client-dashboard" replace />;
  }

  return <>{children}</>;
};

// Auth route - redirect if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isRoleLoading, isAdmin } = useAuth();

  // Show loading while checking auth/role
  if (isLoading || (user && isRoleLoading)) {
    return <LoadingSpinner />;
  }

  // Already logged in -> redirect based on role
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/client-dashboard" replace />;
  }

  return <>{children}</>;
};

// Public route - redirect logged-in users
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isRoleLoading, isAdmin } = useAuth();

  // Show loading while checking auth/role
  if (isLoading || (user && isRoleLoading)) {
    return <LoadingSpinner />;
  }

  // Already logged in -> redirect based on role
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/client-dashboard" replace />;
  }

  return <>{children}</>;
};

// App routes component (needs to be inside AuthProvider)
const AppRoutes = () => {
  return (
    <VehicleDataProvider>
      <Routes>
        {/* Public landing page - redirects logged in users */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } 
        />
        
        {/* Auth page - redirects logged in users */}
        <Route 
          path="/auth" 
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          } 
        />
        
        {/* Client dashboard - protected, only for non-admin users */}
        <Route 
          path="/client-dashboard" 
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin dashboard - only for admins */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* Legacy redirects for old routes */}
        <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/client" element={<Navigate to="/client-dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </VehicleDataProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
