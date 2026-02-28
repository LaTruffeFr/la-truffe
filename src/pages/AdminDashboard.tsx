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
  Crown, BrainCircuit, ShieldAlert, Check, X, Eye, Trash2
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

// --- DONNÉES FACTICES POUR LA MODÉRATION (En attendant Supabase) ---
const mockPendingListings = [
  { id: '1', titre: 'Peugeot 208 GT Line 130ch', prix: 15500, km: 65000, annee: 2020, user: 'jean.dupont@email.com', date: 'Aujourd\'hui', status: 'pending', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800' },
  { id: '2', titre: 'Volkswagen Golf 7 GTI Performance', prix: 22000, km: 110000, annee: 2018, user: 'marc.auto@email.com', date: 'Hier', status: 'pending', image: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&q=80&w=800' },
];

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
      
      {/* HEADER GLOBAL ADMIN */}
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
        <div className="bg-white border-b border-slate-200 px-6 print:hidden shadow-sm z-40 relative overflow-x-auto">
          <TabsList className="h-16 bg-transparent gap-8 max-w-7xl mx-auto w-full justify-start min-w-max">
            <TabsTrigger value="scanner" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-indigo-600 data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 data-[state=inactive]:text-slate-500">
              <BarChart3 className="w-5 h-5 mr-2" /> Scanner d'Opportunités
            </TabsTrigger>
            
            {/* NOUVEL ONGLET MODÉRATION */}
            <TabsTrigger value="moderation" className="rounded-none h-full px-0 font-bold text-base data-[state=active]:text-rose-600 data-[state=active]:border-b-4 data-[state=active]:border-rose-600 data-[state=inactive]:text-slate-500 relative">
              <ShieldAlert className="w-5 h-5 mr-2" /> Modération Annonces
              <span className="absolute top-2 -right-3 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
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
        {/* NOUVEAU : ONGLET MODÉRATION */}
        {/* ------------------------------------- */}
        <TabsContent value="moderation" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
                Modération de la Marketplace
              </h2>
              <p className="text-slate-500 font-medium mt-2">Approuvez ou refusez les annonces déposées par les utilisateurs avant leur publication publique.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">En attente</p>
                <p className="text-2xl font-black text-rose-600">{mockPendingListings.length}</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Publiées (24h)</p>
                <p className="text-2xl font-black text-emerald-600">14</p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-100 shadow-xl rounded-3xl bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs py-4 pl-6">Annonce</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs py-4">Utilisateur</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs py-4">Données</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs py-4">Date</TableHead>
                  <TableHead className="text-right font-black text-slate-500 uppercase tracking-widest text-xs py-4 pr-6">Décision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPendingListings.map((listing) => (
                  <TableRow key={listing.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img src={listing.image} alt={listing.titre} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{listing.titre}</p>
                          <Badge className="bg-rose-100 text-rose-700 border-0 mt-1 hover:bg-rose-100">En attente de validation</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-700">{listing.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-lg text-indigo-600">{safeNum(listing.prix)} €</p>
                      <p className="text-sm font-bold text-slate-500">{safeNum(listing.km)} km • {listing.annee}</p>
                    </TableCell>
                    <TableCell className="font-medium text-slate-500">
                      {listing.date}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Voir l'annonce">
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-xl shadow-sm border border-emerald-100" title="Approuver">
                          <Check className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl shadow-sm border border-rose-100" title="Refuser">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {mockPendingListings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center text-slate-500">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                      <p className="font-bold text-lg text-slate-900">Tout est propre !</p>
                      <p>Aucune annonce en attente de modération.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ------------------------------------- */}
        {/* ONGLET 2 : LE SCANNER */}
        {/* ------------------------------------- */}
        <TabsContent value="scanner" className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
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

              {/* ... Le reste de ton code du scanner (En-tête Véhicule, Graphique Sniper, etc.) reste identique ... */}
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

            </>
          )}
        </TabsContent>

        {/* ------------------------------------- */}
        {/* ONGLET 3 : COMMANDES CLIENTS */}
        {/* ------------------------------------- */}
        <TabsContent value="orders" className="flex-1 m-0 p-6 max-w-7xl mx-auto w-full animate-in fade-in">
          <ClientOrdersPanel />
        </TabsContent>

        {/* ------------------------------------- */}
        {/* ONGLET 4 : GESTION VIP */}
        {/* ------------------------------------- */}
        <TabsContent value="vip" className="flex-1 m-0 p-6 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in">
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
