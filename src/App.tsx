import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Importations basées EXACTEMENT sur ta liste de fichiers
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Cote from "./pages/Cote";
import Audit from "./pages/Audit"; 
import Marketplace from "./pages/Marketplace"; 
import Vendre from "./pages/SellCar"; // On connecte l'URL /vendre à ton composant SellCar.tsx
import ReportView from "./pages/ReportView"; // On utilise ton ReportView.tsx
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Pages publiques */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cote" element={<Cote />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/vendre" element={<Vendre />} />
            <Route path="/report/:id" element={<ReportView />} />
            
            {/* Tableaux de bord */}
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Redirections de compatibilité (pour éviter les 404 sur les anciens liens) */}
            <Route path="/settings" element={<Navigate to="/client" replace />} />
            <Route path="/transactions" element={<Navigate to="/client" replace />} />

            {/* Page 404 par défaut */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
