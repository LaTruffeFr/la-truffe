import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { VehicleWithScore } from '@/lib/csvParser';
import { useVehicleData } from '@/contexts/VehicleDataContext';
import { supabase } from '@/integrations/supabase/client';

// Composants
import { CSVImportModal } from '@/components/trading/CSVImportModal';
import { ClientOrdersPanel } from '@/components/admin/ClientOrdersPanel';
import { PublishReportModal } from '@/components/admin/PublishReportModal';
import { VipManagementPanel } from '@/components/admin/VipManagementPanel';
import { WaitlistPanel } from '@/components/admin/WaitlistPanel';
import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';

// UI & Icônes
import { 
  Loader2, Crosshair, RotateCcw, Upload, SlidersHorizontal, 
  BarChart3, ShoppingBag, User, Settings, LogOut, Send,
  CheckCircle2, AlertTriangle, Gauge, Fuel, Euro, ShieldCheck, 
  Calendar, MapPin, Search, Share2, Trophy, ListFilter, ExternalLink,
  Crown, BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

function calculateLogTrendLine(data: any[]): { type: string; a: number; b: number } {
  if (!data || data.length < 2) return { type: 'log', a: 0, b: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  let count = 0;
  data.forEach(v => {
    if (v.kilometrage > 100 && v.prix > 1000) {
      const x = Math.log(v.kilometrage);
      const y = v.prix;
      sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
      count++;
    }
  });
  if (count < 2) return { type: 'log', a: 0, b: 0 };
  const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / count;
  return { type: 'log', a: intercept, b: slope };
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const {
    vehicles, filteredVehicles, chartVehicles, filters, dataRanges,
    isLoading, loadingProgress, vehicleInfo, setFilters, uploadCSV, clearData, kpis,
  } = useVehicleData();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [clients, setClients] = useState<any[]>([]);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from('reports').select('id, marque, modele, status').eq('status', 'pending');
      if (!error && data) setClients(data); 
      else setClients([]);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (showAllVehicles && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showAllVehicles]);

  const handleImport = useCallback((file: File, marque: string, modele: string) => {
    uploadCSV(file, marque, modele);
  }, [uploadCSV]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const trendLine = useMemo(() => calculateLogTrendLine(chartVehicles), [chartVehicles]);

  const bestDeal = useMemo(() => {
    if (chartVehicles.length === 0) return null;
    return [...chartVehicles].sort((a, b) => b.dealScore - a.dealScore)[0];
  }, [chartVehicles]);

  const topOpportunities = useMemo(() => {
    if (chartVehicles.length === 0) return [];
    return [...chartVehicles].sort((a, b) => b.dealScore - a.dealScore).slice(0, 5);
  }, [chartVehicles]);

  const stats = useMemo(() => {
    const prixMarche = kpis.avgPrice;
    const prixCible = bestDeal ? bestDeal.prix : prixMarche;
    const economy = prixMarche - prixCible;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    const score = bestDeal ? bestDeal.dealScore : 50;
    return { prixMarche, prixCible, economy, percentEconomy, score, isGoodDeal: economy > 0, totalVehicules: chartVehicles.length };
  }, [kpis, bestDeal, chartVehicles]);

  const expertOpinionPreview = useMemo(() => {
    if (!vehicleInfo || !bestDeal) return "En attente de données...";
    let avis = `La ${vehicleInfo.marque} ${vehicleInfo.modele} (${bestDeal.annee}) est un modèle actif sur le marché avec ${stats.totalVehicules} annonces analysées.\n\n`;
    if (stats.isGoodDeal) {
      avis += `Notre IA a détecté une excellente opportunité avec une économie potentielle de ${Math.abs(stats.percentEconomy)}% par rapport à la vraie cote du marché.`;
    } else {
      avis += `Les prix sont actuellement très soutenus sur ce segment. Il n'y a pas d'opportunité majeure de négociation en ce moment.`;
    }
    return avis;
  }, [vehicleInfo, bestDeal, stats]);

  // --- LOADER IA PREMIUM ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="relative mb-12">
          <BrainCircuit className="w-28 h-28 text-indigo-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-black mb-6 tracking-tight text-center">Génération du Rapport Global...</h2>
        <div className="w-80 bg-slate-800 rounded-full h-2.5 overflow-hidden mb-4 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-indigo-400 font-bold text-lg">{loadingProgress}%</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* HEADER GLOBAL ADMIN (Dark Mode) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2">
            La Truffe <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-widest">Master Admin</span>
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
              <DropdownMenuItem className="gap-2 font-bold text-slate-700 cursor-pointer rounded-lg hover:bg-slate-50"><Settings className="h-4 w-4" /> Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 my-1" />
              <DropdownMenuItem onClick={handleSignOut} className="gap-2 font-bold text-red-600 cursor-pointer rounded-lg hover:bg-red-50"><LogOut className="h-4 w-4" /> Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* TABS PRINCIPAUX */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 print:hidden shadow-sm z-40 relative">
          <TabsList className="h-16 bg-transparent gap-8 max-w-7xl mx-auto w-full justify-start">
            <TabsTrigger value="scanner" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <BarChart3 className="w-5 h-5 mr-2" /> Scanner d'Opportunités
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <ShoppingBag className="w-5 h-5 mr-2" /> Commandes Clients
            </TabsTrigger>
            <TabsTrigger value="vip" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <Crown className="w-5 h-5 mr-2" /> Gestion VIP & Membres
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------- */}
        {/* ONGLET 1 : LE SCANNER */}
        {/* ------------------------------------- */}
        <TabsContent value="scanner" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-indigo-100">
                <Crosshair className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Le Radar est prêt</h2>
              <p className="text-slate-500 text-lg mb-8 max-w-md">Importez un dataset pour lancer l'algorithme d'analyse et repérer les anomalies du marché.</p>
              <Button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                <Upload className="w-5 h-5 mr-3" /> Importer un Fichier CSV
              </Button>
            </div>
          ) : (
            <>
              {/* BARRE D'ACTIONS ADMIN */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg sticky top-24 z-30 transition-all print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      {vehicleInfo?.marque} {vehicleInfo?.modele}
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">{filteredVehicles.length} annonces</Badge>
                    </h2>
                    <div className="hidden md:block w-px h-8 bg-slate-200" />
                    <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className={`font-bold rounded-xl border-slate-200 ${isFiltersOpen ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>
                      <SlidersHorizontal className="w-4 h-4 mr-2" /> {isFiltersOpen ? 'Masquer Filtres' : 'Filtres'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={clearData} className="text-slate-500 hover:text-red-600 font-bold rounded-xl">
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="font-bold rounded-xl border-slate-200 text-slate-700">
                      <Upload className="w-4 h-4 mr-2" /> Nouveau Scan
                    </Button>
                    <Button onClick={() => setIsPublishModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 border-0">
                      <Send className="w-4 h-4 mr-2" /> PUBLIER LE RAPPORT
                    </Button>
                  </div>
                </div>

                {/* PANNEAU DE FILTRES DÉROULANT */}
                {isFiltersOpen && (
                  <div className="w-full mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                      <Label className="font-bold text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"/> Prix : {filters.minPrice}€ - {filters.maxPrice}€</Label>
                      <Slider value={[filters.minPrice, filters.maxPrice]} onValueChange={(val) => setFilters({ minPrice: val[0], maxPrice: val[1] })} min={0} max={dataRanges.maxPrice} step={500} className="py-2" />
                    </div>
                    <div className="space-y-4">
                      <Label className="font-bold text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Kilométrage : {filters.minKm}km - {filters.maxKm}km</Label>
                      <Slider value={[filters.minKm, filters.maxKm]} onValueChange={(val) => setFilters({ minKm: val[0], maxKm: val[1] })} min={0} max={dataRanges.maxKm} step={1000} className="py-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* 1. EN-TÊTE VÉHICULE (Top Deal) */}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                  <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3] group bg-white">
                    <img 
                      src={bestDeal?.image || `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`}
                      alt="Véhicule cible"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`; }}
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className={`${stats.isGoodDeal ? 'bg-emerald-500' : 'bg-amber-500'} text-white px-4 py-1.5 shadow-lg border-0 font-bold text-sm`}>
                        {stats.isGoodDeal ? 'Pépite Détectée' : 'Prix Marché'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-2/3 flex flex-col justify-between">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl h-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                      <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{vehicleInfo?.marque} {vehicleInfo?.modele}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-800 font-bold">{bestDeal?.annee}</span>
                          • {bestDeal?.titre?.substring(0, 50) || 'Modèle standard'}...
                        </p>
                      </div>
                      <div className="text-left md:text-right p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Meilleur Prix Trouvé</div>
                        <div className="text-4xl font-black text-indigo-600">{safeNum(bestDeal?.prix || stats.prixMarche)} €</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Gauge, color: "blue", label: "Kilométrage", value: `${safeNum(bestDeal?.kilometrage)} km` },
                        { icon: Fuel, color: "orange", label: "Carburant", value: bestDeal?.carburant || 'Essence' },
                        { icon: Calendar, color: "purple", label: "Année", value: bestDeal?.annee },
                        { icon: ShieldCheck, color: "emerald", label: "Score", value: `${stats.score}/100` }
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                          <div className={`p-3 bg-${stat.color}-100 text-${stat.color}-600 rounded-xl`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="font-black text-slate-900">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. VERDICT TRUFFE */}
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-slate-100 shadow-xl bg-white overflow-hidden rounded-3xl relative">
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${stats.isGoodDeal ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'}`} />
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                    <h3 className="text-slate-400 font-black text-sm uppercase tracking-widest mb-6">Indice de Confiance</h3>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                        <circle 
                          cx="80" cy="80" r="70" 
                          stroke="currentColor" strokeWidth="12" fill="transparent" 
                          strokeDasharray={440} 
                          strokeDashoffset={440 - (440 * stats.score) / 100} 
                          className={stats.isGoodDeal ? 'text-emerald-500' : 'text-amber-500'} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-5xl font-black text-slate-900">{stats.score}</span>
                    </div>
                    <p className={`mt-6 font-black text-xl flex items-center gap-2 ${stats.isGoodDeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {stats.isGoodDeal ? <><CheckCircle2 className="w-6 h-6" /> Pépite Validée</> : <><AlertTriangle className="w-6 h-6" /> Achat Standard</>}
                    </p>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-100 shadow-xl bg-slate-900 text-white rounded-3xl">
                  <CardContent className="p-8 h-full flex flex-col justify-center">
                    <h3 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Euro className="w-5 h-5" /> Analyse Financière IA
                    </h3>
                    
                    <div className="flex flex-wrap items-center justify-between mb-8 gap-6">
                      <div>
                        <p className="text-slate-400 font-bold mb-2">Vraie Cote du Marché</p>
                        <p className="text-4xl font-black text-white">{safeNum(stats.prixMarche)} €</p>
                      </div>
                      <div className="text-left md:text-right p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-slate-400 font-bold mb-2">Marge de Négociation</p>
                        <p className={`text-4xl font-black ${stats.economy > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stats.economy > 0 ? '+' : ''}{safeNum(stats.economy)} €
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <div className="flex justify-between text-sm mb-3 font-bold text-slate-300">
                        <span>Positionnement Global du modèle</span>
                        <span className={stats.isGoodDeal ? "text-emerald-400" : "text-amber-400"}>
                          {stats.isGoodDeal ? "En dessous de la cote" : "Prix ferme"}
                        </span>
                      </div>
                      <Progress value={Math.min(100, Math.max(0, 50 - stats.percentEconomy))} className="h-3 bg-slate-900 [&>div]:bg-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3. GRAPHIQUE SNIPER (Interactif) */}
              <div>
                <Card className="shadow-2xl border-slate-100 overflow-hidden rounded-3xl bg-white">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Crosshair className="w-6 h-6 text-indigo-600" /> Le Radar de Dispersion
                    </h2>
                    <Badge variant="outline" className="font-bold text-slate-500 border-slate-200">Algorithme Linéaire/Log</Badge>
                  </div>
                  <CardContent className="p-6 h-[500px]">
                    <SniperChart 
                      data={chartVehicles as any} 
                      trendLine={trendLine}
                      onVehicleClick={(vehicle) => {
                        const v = { ...vehicle, score_confiance: vehicle.dealScore };
                        setSelectedVehicle(v as any);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* 4. TOP 5 OPPORTUNITÉS */}
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-500" /> Les 5 Meilleures Opportunités
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {topOpportunities.map((deal, idx) => (
                    <Card key={idx} className="overflow-hidden shadow-xl border-slate-100 rounded-3xl group bg-white hover:border-indigo-300 transition-colors">
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img 
                          src={deal.image || "/placeholder.svg"} 
                          alt={deal.titre}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`; }}
                        />
                        <div className="absolute top-4 left-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center font-black text-slate-900 text-lg">
                            #{idx + 1}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-slate-900 text-lg truncate mb-4">{deal.titre}</h3>
                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-3xl font-black text-indigo-600 mb-1">{safeNum(deal.prix)} €</p>
                            <p className="text-sm font-bold text-slate-500">{safeNum(deal.kilometrage)} km • {deal.annee}</p>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-3 py-1">
                            {Math.round(100 - (deal.prix / (stats.prixMarche || 1) * 100))}% sous cote
                          </Badge>
                        </div>
                        <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold" onClick={() => window.open(deal.lien, '_blank')}>
                          Voir l'annonce
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* CARTE DÉCLENCHEUR ADMIN - VERSION XXL */}
                  <Card 
                    className="flex flex-col items-center justify-center p-10 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 cursor-pointer shadow-xl border-0 rounded-3xl min-h-[400px]"
                    onClick={() => setShowAllVehicles(true)}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                      <ListFilter className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-black text-3xl text-center mb-4 tracking-tight">Base de Données</h3>
                    <p className="text-slate-400 text-center font-medium mb-8">
                      Gérer les <span className="text-white font-bold">{filteredVehicles.length} annonces</span> du dataset actuel.
                    </p>
                    <Button variant="secondary" className="w-full h-12 font-bold rounded-xl bg-white text-slate-900 hover:bg-slate-100 pointer-events-none">
                      Ouvrir le tableau
                    </Button>
                  </Card>
                </div>
              </div>

              {/* TABLEAU LISTE COMPLÈTE */}
              {showAllVehicles && (
                <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-10 scroll-mt-24 pb-12">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Search className="w-6 h-6 text-indigo-600" /> Inventaire Complet
                  </h3>
                  <Card className="overflow-hidden border-slate-100 shadow-2xl rounded-3xl bg-white">
                    <div className="max-h-[800px] overflow-auto">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 h-16 shadow-sm">
                          <TableRow>
                            <TableHead className="w-[180px] pl-8 font-black text-slate-500 uppercase tracking-widest text-xs">Aperçu</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs">Véhicule</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs">Prix</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs">Km</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs">Année</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs">Score</TableHead>
                            <TableHead className="text-right pr-8 font-black text-slate-500 uppercase tracking-widest text-xs">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartVehicles.sort((a, b) => b.dealScore - a.dealScore).map((vehicle, i) => {
                            const isSuspicious = vehicle.dealScore >= 95;
                            return (
                              <TableRow key={i} className={`transition-colors border-b border-slate-100 cursor-pointer ${isSuspicious ? 'bg-rose-50/50 hover:bg-rose-100/50' : 'hover:bg-slate-50'}`} onClick={() => setSelectedVehicle(vehicle as any)}>
                                <TableCell className="pl-8 py-4">
                                  <div className="w-32 h-20 bg-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                                    <img src={vehicle.image || "/placeholder.svg"} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${vehicleInfo?.marque}`; }} />
                                    {isSuspicious && <div className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">ALERTE</div>}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="font-bold text-slate-900 mb-1 line-clamp-1">{vehicle.titre}</div>
                                  <div className="text-xs font-bold text-slate-400">{vehicle.localisation || "France"}</div>
                                </TableCell>
                                <TableCell className={`py-4 font-black text-lg ${isSuspicious ? 'text-rose-600' : 'text-slate-900'}`}>{safeNum(vehicle.prix)} €</TableCell>
                                <TableCell className="py-4 font-bold text-slate-600">{safeNum(vehicle.kilometrage)} km</TableCell>
                                <TableCell className="py-4 font-bold text-slate-600">{vehicle.annee}</TableCell>
                                <TableCell className="py-4">
                                  <Badge className={`font-bold px-2 py-1 ${vehicle.dealScore > 80 ? (isSuspicious ? "bg-rose-600" : "bg-emerald-500") : "bg-slate-300 text-slate-700"}`}>
                                    {vehicle.dealScore}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8 py-4">
                                  <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white" onClick={(e) => { e.stopPropagation(); window.open(vehicle.lien, '_blank'); }}>
                                    <ExternalLink className="w-5 h-5 text-slate-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ------------------------------------- */}
        {/* ONGLET 2 : COMMANDES CLIENTS */}
        {/* ------------------------------------- */}
        <TabsContent value="orders" className="flex-1 m-0 p-6 max-w-7xl mx-auto w-full">
          <ClientOrdersPanel />
        </TabsContent>

        {/* ------------------------------------- */}
        {/* ONGLET 3 : GESTION VIP */}
        {/* ------------------------------------- */}
        <TabsContent value="vip" className="flex-1 m-0 p-6 max-w-4xl mx-auto w-full space-y-8">
          <WaitlistPanel />
          <VipManagementPanel />
        </TabsContent>

      </Tabs>

      {/* MODALES */}
      <CSVImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImport} />
      <PublishReportModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} vehicles={chartVehicles} trendLine={trendLine as any} kpis={kpis} vehicleInfo={vehicleInfo} clients={clients} />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
}
