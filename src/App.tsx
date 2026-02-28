import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Importation des pages (Vérifie que tous ces fichiers existent bien dans src/pages/)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Cote from "./pages/Cote";
// On garde une route pour le scanner d'audit (si tu as une page Audit.tsx)
import Audit from "./pages/Index"; // ou "./pages/Audit" selon le nom de ton fichier
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

// Remarque : Si Marketplace.tsx et Vendre.tsx n'existent pas encore, 
// Lovable risque de mettre une petite erreur. Dis-le moi !
import Marketplace from "./pages/Marketplace"; 
import Vendre from "./pages/Vendre"; 

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
            <Route path="/report/:id" element={<Report />} />
            
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
