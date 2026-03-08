import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { VehicleWithScore } from "@/lib/csvParser";
import { useVehicleData, VehicleDataProvider } from "@/contexts/VehicleDataContext";
import { supabase } from "@/integrations/supabase/client";

// Composants
import { CSVImportModal } from "@/components/trading/CSVImportModal";
import { ClientOrdersPanel } from "@/components/admin/ClientOrdersPanel";
import { PublishReportModal } from "@/components/admin/PublishReportModal";
import { VipManagementPanel } from "@/components/admin/VipManagementPanel";
import { WaitlistPanel } from "@/components/admin/WaitlistPanel";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import { SniperChart } from "@/components/trading/SniperChart";
import { OpportunityModal } from "@/components/trading/OpportunityModal";
import { useToast } from "@/hooks/use-toast";

// UI & Icônes
import {
  Loader2, Crosshair, RotateCcw, Upload, SlidersHorizontal, BarChart3,
  ShoppingBag, User, Settings, LogOut, Send, CheckCircle2, AlertTriangle,
  Gauge, Fuel, Euro, ShieldCheck, Calendar, MapPin, Search, Share2, Trophy,
  ListFilter, ExternalLink, Crown, ShieldAlert, Check, X, Eye, Trash2,
  Users, CreditCard, FileText, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString("fr-FR");
};

function calculateLogTrendLine(data: any[]): { type: string; a: number; b: number } {
  if (!data || data.length < 2) return { type: "log", a: 0, b: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  let count = 0;
  data.forEach((v) => {
    if (v.kilometrage > 100 && v.prix > 1000) {
      const x = Math.log(v.kilometrage);
      const y = v.prix;
      sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; count++;
    }
  });
  if (count < 2) return { type: "log", a: 0, b: 0 };
  const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / count;
  return { type: "log", a: intercept, b: slope };
}

interface PendingListing {
  id: string; marque: string; modele: string; prix: number; kilometrage: number;
  annee: number; user_id: string; created_at: string; status: string;
  image_url: string; images?: string[]; description: string; score_ia: number;
  seller_contact: string; carburant: string;
}

interface AdminUser {
  user_id: string; email: string; credits: number; created_at: string;
}

function AdminDashboardInner() {
  const { signOut, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    vehicles, filteredVehicles, chartVehicles, filters, dataRanges,
    isLoading, loadingProgress, vehicleInfo, setFilters, uploadCSV, clearData, kpis,
  } = useVehicleData();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // CRM State
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // NOUVEAU: État de chargement

  const fetchPendingListings = async () => {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error && data) setPendingListings(data as PendingListing[]);
    else setPendingListings([]);
  };

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email, credits, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setAllUsers(data as AdminUser[]);
    setIsLoadingUsers(false);
  };

  const fetchUserHistory = async (userId: string) => {
    setSelectedUserId(userId);
    setUserReports([]);
    setUserListings([]);
    setIsUserModalOpen(true);
    setIsLoadingHistory(true);

    const [reportsRes, listingsRes] = await Promise.all([
      supabase
        .from("reports")
        .select("id, marque, modele, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("marketplace_listings")
        .select("id, marque, modele, status, created_at, prix")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (reportsRes.error) {
      console.error("Erreur de sécurité Reports:", reportsRes.error);
      toast({ variant: "destructive", title: "Blocage Sécurité", description: "Supabase bloque l'accès aux rapports (RLS)." });
    }

    setUserReports(reportsRes.data || []);
    setUserListings(listingsRes.data || []);
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPendingListings();
      fetchAllUsers();
    } else if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  const handleApprove = async (id: string) => {
    try {
      await supabase.from("marketplace_listings").update({ status: "approved" } as any).eq("id", id);
      toast({ title: "Annonce validée ! ✅", className: "bg-emerald-600 text-white" });
      fetchPendingListings();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase.from("marketplace_listings").update({ status: "rejected" } as any).eq("id", id);
      toast({ title: "Annonce refusée ❌", className: "bg-rose-600 text-white" });
      fetchPendingListings();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur" });
    }
  };

  useEffect(() => {
    if (showAllVehicles && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showAllVehicles]);

  const handleImport = useCallback(
    (file: File, marque: string, modele: string) => { uploadCSV(file, marque, modele); },
    [uploadCSV],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const trendLine = useMemo(() => calculateLogTrendLine(chartVehicles), [chartVehicles]);

  const bestDeal = useMemo(() => {
    if (chartVehicles.length === 0) return null;
    return [...chartVehicles].sort((a, b) => b.dealScore - a.dealScore)[0];
  }, [chartVehicles]);

  const stats = useMemo(() => {
    const prixMarche = kpis.avgPrice;
    const prixCible = bestDeal ? bestDeal.prix : prixMarche;
    const economy = prixMarche - prixCible;
    const score = bestDeal ? bestDeal.dealScore : 50;
    return { prixMarche, prixCible, economy, score, isGoodDeal: economy > 0, totalVehicules: chartVehicles.length };
  }, [kpis, bestDeal, chartVehicles]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-black mb-2 tracking-tight text-center">Initialisation Tour de Contrôle...</h2>
        <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden mb-4 shadow-inner">
          <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${loadingProgress || 50}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-slate-900">
      {/* HEADER GLOBAL ADMIN */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2">
            La Truffe <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-lg uppercase tracking-widest">Master Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
                <User className="h-5 w-5 text-indigo-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-slate-100 p-2">
              <DropdownMenuItem className="gap-2 font-bold text-slate-700 cursor-pointer rounded-lg hover:bg-slate-50">
                <Settings className="h-4 w-4" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 my-1" />
              <DropdownMenuItem onClick={handleSignOut} className="gap-2 font-bold text-red-600 cursor-pointer rounded-lg hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* TABS PRINCIPAUX */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 print:hidden shadow-sm z-40 relative overflow-x-auto">
          <TabsList className="h-16 bg-transparent gap-8 max-w-7xl mx-auto w-full justify-start min-w-max">
            <TabsTrigger value="overview" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <BarChart3 className="w-5 h-5 mr-2" /> Vue d'Ensemble
            </TabsTrigger>
            <TabsTrigger value="moderation" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-rose-600 data-[state=active]:border-b-4 data-[state=active]:border-rose-600 data-[state=inactive]:text-slate-500 relative">
              <ShieldAlert className="w-5 h-5 mr-2" /> Modération
              {pendingListings.length > 0 && <span className="absolute top-2 -right-3 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>}
            </TabsTrigger>
            <TabsTrigger value="scanner" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <BarChart3 className="w-5 h-5 mr-2" /> Scanner (CSV)
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <ShoppingBag className="w-5 h-5 mr-2" /> Commandes Clients
            </TabsTrigger>
            <TabsTrigger value="vip" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <Crown className="w-5 h-5 mr-2" /> Gestion VIP
            </TabsTrigger>
            <TabsTrigger value="crm" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <Users className="w-5 h-5 mr-2" /> CRM & Utilisateurs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- ONGLET MODÉRATION --- */}
        <TabsContent value="moderation" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-500" /> Modération Marketplace
              </h2>
              <p className="text-slate-500 font-medium mt-2">Contrôle des annonces déposées avant leur publication publique.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En attente</p>
                <p className="text-3xl font-black text-rose-600">{pendingListings.length}</p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5 pl-8">Véhicule</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5">Vendeur</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5">Détails</TableHead>
                  <TableHead className="text-right font-black text-slate-500 uppercase tracking-widest text-[10px] py-5 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingListings.map((listing) => {
                  let displayImage = "/placeholder.svg";
                  if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) displayImage = listing.images[0];
                  else if (listing.image_url) displayImage = listing.image_url;

                  return (
                    <TableRow key={listing.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-5">
                          <div className="w-32 h-24 rounded-2xl overflow-hidden bg-slate-200 shrink-0 shadow-inner group-hover:shadow-md transition-shadow">
                            <img src={displayImage} alt={listing.modele} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-tight">{listing.marque}</p>
                            <p className="font-bold text-indigo-600 text-sm">{listing.modele}</p>
                            <Badge className="bg-rose-100 text-rose-700 border-0 mt-2 hover:bg-rose-100 text-[10px] uppercase tracking-widest">En attente</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-bold text-slate-700 text-xs font-mono">{listing.user_id.slice(0, 8)}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
                          📞 {listing.seller_contact || "Non renseigné"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-[1000] text-2xl text-emerald-600 tracking-tighter">{safeNum(listing.prix)} €</p>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">{safeNum(listing.kilometrage)} km</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-md">{listing.annee}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-md capitalize">{listing.carburant}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium line-clamp-1 italic max-w-xs">"{listing.description}"</p>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end gap-2">
                          <Button onClick={() => handleApprove(listing.id)} className="w-32 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">
                            <Check className="w-4 h-4 mr-2" /> Approuver
                          </Button>
                          <Button variant="outline" onClick={() => handleReject(listing.id)} className="w-32 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl">
                            <X className="w-4 h-4 mr-2" /> Refuser
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {pendingListings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-24 text-center">
                      <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
                      <p className="font-black text-2xl text-slate-900 tracking-tight">Tout est propre !</p>
                      <p className="text-slate-500 font-medium mt-2">Aucune annonce en attente de modération.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* --- ONGLET SCANNER --- */}
        <TabsContent value="scanner" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-indigo-100">
                <Crosshair className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Le Radar est prêt</h2>
              <p className="text-slate-500 text-lg mb-8 max-w-md">Importez un dataset CSV pour lancer l'algorithme d'analyse et repérer les anomalies du marché.</p>
              <Button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                <Upload className="w-5 h-5 mr-3" /> Importer un Fichier CSV
              </Button>
            </div>
          ) : (
            <>
              {/* BARRE D'ACTIONS ADMIN */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl sticky top-24 z-30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      {vehicleInfo?.marque} {vehicleInfo?.modele}
                      <Badge className="bg-indigo-50 text-indigo-700 border-0 font-black px-3 py-1">
                        {filteredVehicles.length} annonces
                      </Badge>
                    </h2>
                    <div className="hidden md:block w-px h-8 bg-slate-200" />
                    <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className={`font-bold rounded-xl border-slate-200 ${isFiltersOpen ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>
                      <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtres
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={clearData} className="text-slate-500 hover:text-rose-600 font-bold rounded-xl">
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="font-bold rounded-xl border-slate-200 text-slate-700">
                      <Upload className="w-4 h-4 mr-2" /> Scan
                    </Button>
                  </div>
                </div>

                {isFiltersOpen && (
                  <div className="w-full mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
                    <div className="space-y-4">
                      <Label className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Prix : {filters.minPrice}€ - {filters.maxPrice}€
                      </Label>
                      <Slider value={[filters.minPrice, filters.maxPrice]} onValueChange={(val) => setFilters({ minPrice: val[0], maxPrice: val[1] })} min={0} max={dataRanges.maxPrice} step={500} />
                    </div>
                    <div className="space-y-4">
                      <Label className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Kilométrage : {filters.minKm}km - {filters.maxKm}km
                      </Label>
                      <Slider value={[filters.minKm, filters.maxKm]} onValueChange={(val) => setFilters({ minKm: val[0], maxKm: val[1] })} min={0} max={dataRanges.maxKm} step={1000} />
                    </div>
                  </div>
                )}
              </div>

              {/* EN-TÊTE VÉHICULE */}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white aspect-[4/3] group bg-slate-100">
                    <img src={bestDeal?.image || `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`} alt="Véhicule cible" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`; }} />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-emerald-500 text-white px-4 py-2 shadow-lg border-0 font-black uppercase tracking-widest text-[10px]">Pépite Détectée</Badge>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-2/3 flex flex-col justify-between">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl h-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6">
                      <div>
                        <h1 className="text-4xl md:text-5xl font-[1000] text-slate-900 tracking-tighter mb-4">{vehicleInfo?.marque} {vehicleInfo?.modele}</h1>
                        <p className="text-slate-500 font-bold flex items-center gap-3">
                          <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-800">{bestDeal?.annee}</span>• {bestDeal?.titre?.substring(0, 40) || "Modèle standard"}...
                        </p>
                      </div>
                      <div className="text-left md:text-right p-6 bg-slate-900 rounded-[2rem] text-white shadow-lg">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Meilleur Prix Trouvé</div>
                        <div className="text-5xl font-[1000] tracking-tighter">{safeNum(bestDeal?.prix || stats.prixMarche)} €</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Gauge, color: "text-indigo-600", bg: "bg-indigo-50", label: "Kilométrage", value: `${safeNum(bestDeal?.kilometrage)} km` },
                        { icon: Fuel, color: "text-amber-600", bg: "bg-amber-50", label: "Carburant", value: bestDeal?.carburant || "Essence" },
                        { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", label: "Année", value: bestDeal?.annee },
                        { icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", label: "Score", value: `${stats.score}/100` },
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col gap-3">
                          <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="font-black text-slate-900 text-lg">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE SNIPER */}
              <div>
                <Card className="shadow-2xl border-0 overflow-hidden rounded-[3rem] bg-slate-950 p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-3xl font-[1000] text-white flex items-center gap-3 tracking-tighter">
                      <Crosshair className="w-8 h-8 text-indigo-500" /> Radar de Dispersion
                    </h2>
                  </div>
                  <CardContent className="p-0 h-[500px]">
                    <SniperChart
                      data={chartVehicles as any} trendLine={trendLine}
                      onVehicleClick={(vehicle) => { const v = { ...vehicle, score_confiance: vehicle.dealScore }; setSelectedVehicle(v as any); }}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="flex-1 m-0 p-6 max-w-7xl mx-auto w-full animate-in fade-in"><ClientOrdersPanel /></TabsContent>
        <TabsContent value="vip" className="flex-1 m-0 p-6 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in"><VipManagementPanel /></TabsContent>

        {/* --- ONGLET CRM & UTILISATEURS --- */}
        <TabsContent value="crm" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-500" /> CRM & Utilisateurs
              </h2>
              <p className="text-slate-500 font-medium mt-2">Vue d'ensemble de votre base clients.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-100 shadow-lg bg-white">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comptes créés</p>
                <p className="text-4xl font-black text-slate-900">{allUsers.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-100 shadow-lg bg-white">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Utilisateurs actifs</p>
                <p className="text-4xl font-black text-indigo-600">
                  {allUsers.filter((u) => u.credits !== 1 || new Date(u.created_at) > new Date(Date.now() - 7 * 86400000)).length}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-100 shadow-lg bg-white">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Crédits en circulation</p>
                <p className="text-4xl font-black text-emerald-600">{allUsers.reduce((s, u) => s + u.credits, 0)}</p>
              </CardContent>
            </Card>
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5 pl-8">Email</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5">Crédits</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-5">Inscription</TableHead>
                    <TableHead className="text-right font-black text-slate-500 uppercase tracking-widest text-[10px] py-5 pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.user_id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="pl-8 py-4 font-bold text-slate-900">{u.email}</TableCell>
                      <TableCell><Badge className="bg-indigo-50 text-indigo-700 border-0 font-black">{u.credits}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button size="sm" variant="outline" onClick={() => fetchUserHistory(u.user_id)} className="font-bold rounded-xl border-slate-200">
                          <Eye className="w-4 h-4 mr-2" /> Historique
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* User History Modal (Améliorée avec chargement) */}
          {isUserModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsUserModalOpen(false)}>
              <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Historique Client</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsUserModalOpen(false)}><X className="w-5 h-5" /></Button>
                </div>

                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Récupération des dossiers...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Rapports d'audit ({userReports.length})
                      </h4>
                      {userReports.length === 0 ? (
                        <p className="text-slate-400 text-sm bg-slate-50 p-4 rounded-xl text-center font-medium border border-slate-100">Aucun rapport trouvé pour ce client.</p>
                      ) : (
                        <div className="space-y-2">
                          {userReports.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-900">{r.marque} {r.modele}</p>
                                <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={r.status === "completed" ? "bg-emerald-50 text-emerald-700 border-0" : "bg-amber-50 text-amber-700 border-0"}>{r.status}</Badge>
                                {r.status === "completed" && (
                                  <Button size="sm" variant="ghost" onClick={() => window.open(`/report/${r.id}`, '_blank')} className="text-indigo-600">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Annonces Marketplace ({userListings.length})
                      </h4>
                      {userListings.length === 0 ? (
                        <p className="text-slate-400 text-sm bg-slate-50 p-4 rounded-xl text-center font-medium border border-slate-100">Aucune annonce déposée.</p>
                      ) : (
                        <div className="space-y-2">
                          {userListings.map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-900">{l.marque} {l.modele}</p>
                                <p className="text-xs text-slate-500">{Number(l.prix).toLocaleString("fr-FR")}€ • {new Date(l.created_at).toLocaleDateString("fr-FR")}</p>
                              </div>
                              <Badge className={l.status === "approved" ? "bg-emerald-50 text-emerald-700 border-0" : l.status === "rejected" ? "bg-rose-50 text-rose-700 border-0" : "bg-amber-50 text-amber-700 border-0"}>
                                {l.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CSVImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImport} />
      <PublishReportModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} vehicles={chartVehicles} trendLine={trendLine as any} kpis={kpis} vehicleInfo={vehicleInfo} clients={[]} />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <VehicleDataProvider>
      <AdminDashboardInner />
    </VehicleDataProvider>
  );
}
