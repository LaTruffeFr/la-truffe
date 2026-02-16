import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { VehicleDataProvider } from "@/contexts/VehicleDataContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { BottomNav } from "@/components/app/BottomNav";

// Pages
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
import ReportView from "./pages/ReportView";
import MarketReport from "./pages/MarketReport";
import SellWizard from "./pages/SellWizard";
import VehicleDetail from "./pages/VehicleDetail";
import AnalysisLoading from "./pages/AnalysisLoading";

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
            
            {/* New design pages */}
            <Route path="/market-report" element={<MarketReport />} />
            <Route path="/sell" element={<SellWizard />} />
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/analyzing" element={<AnalysisLoading />} />

            {/* Report routes */}
            <Route path="/report/:id" element={<ReportView />} />
            <Route path="/audit/:id" element={<DemoReportPage />} />
            <Route path="/demo/:id" element={<DemoReportPage />} />

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/admin" element={<AdminRoute><VehicleDataProvider><AdminDashboard /></VehicleDataProvider></AdminRoute>} />
            
            {/* Static pages */}
            <Route path="/enterprise" element={<About />} />
            <Route path="/qui-sommes-nous" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/why-us" element={<About />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<CGV />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
