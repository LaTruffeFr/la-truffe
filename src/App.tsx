import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieBanner } from "@/components/CookieBanner";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Cote from "./pages/Cote";
import Audit from "./pages/Audit"; 
import Marketplace from "./pages/Marketplace"; 
import Vendre from "./pages/SellCar";
import ReportView from "./pages/ReportView";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/cote" element={<Cote />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/vendre" element={<Vendre />} />
              <Route path="/report/:id" element={<ReportView />} />
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/settings" element={<Navigate to="/client" replace />} />
              <Route path="/transactions" element={<Navigate to="/client" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
