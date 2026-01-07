import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { VehicleDataProvider } from "@/contexts/VehicleDataContext";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <VehicleDataProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              {/* Landing page - for everyone */}
              <Route path="/" element={<Landing />} />
              {/* Client dashboard - for logged in users */}
              <Route path="/client" element={<ClientDashboard />} />
              {/* Admin route - Protected for admins only */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </VehicleDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
