import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { VehicleDataProvider } from "@/contexts/VehicleDataContext";
import { ScrollToTop } from "@/components/ScrollToTop";

// Imports des pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import DemoReportPage from "./pages/DemoReportPage";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import PaymentSuccess from "./pages/PaymentSuccess";
import MentionsLegales from "./pages/MentionsLegales";
import CGV from "./pages/CGV";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminRoute } from "./components/AdminRoute";
import SellCar from "./pages/SellCar";
import Marketplace from "./pages/Marketplace";

// 👇 1. IMPORT IMPORTANT : Ta nouvelle page de rapport réel
import ReportView from "./pages/ReportView"; 

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            
            {/* 👇 2. C'EST ICI QUE TU AJOUTES LA ROUTE DU RAPPORT RÉEL */}
            <Route path="/report/:id" element={<ReportView />} />

            {/* Anciennes routes de démo (tu peux les garder) */}
            <Route path="/audit/:id" element={<DemoReportPage />} />
            <Route path="/demo/:id" element={<DemoReportPage />} />

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/admin" element={<AdminRoute><VehicleDataProvider><AdminDashboard /></VehicleDataProvider></AdminRoute>} />
            
            {/* Routes statiques */}
            <Route path="/enterprise" element={<About />} />
            <Route path="/qui-sommes-nous" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/why-us" element={<About />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/vendre" element={<SellCar />} />
            <Route path="/annonces" element={<Marketplace />} />
            <Route path="/cgv" element={<CGV />} />
            
            {/* Route 404 (doit être à la fin) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;