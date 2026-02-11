import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Download, Share2, CheckCircle2, 
  AlertTriangle, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Loader2, Search, MapPin, Trophy, ListFilter, ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';
import { ExpertTag } from '@/lib/vehicleAnalysis'; // Assurez-vous d'importer le type si besoin

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

// --- COULEURS DES BADGES EXPERTS ---
const getTagStyle = (tag: string) => {
  switch (tag) {
    case 'FRAUDE': return 'bg-red-600 text-white border-red-600 animate-pulse';
    case 'FLIP': return 'bg-emerald-500 text-white border-emerald-500';
    case 'COLLECTION': return 'bg-purple-600 text-white border-purple-600';
    case 'TUNING': return 'bg-orange-500 text-white border-orange-500';
    case 'IMPORT': return 'bg-blue-500 text-white border-blue-500';
    case 'LIMPIDE': return 'bg-teal-500 text-white border-teal-500';
    case 'DANGER': return 'bg-black text-white border-black';
    default: return 'bg-slate-200 text-slate-700';
  }
};

// --- CALCUL LOGARITHMIQUE POUR LE GRAPHIQUE ---
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

interface VehicleData {
  id?: string;
  prix: number;
  kilometrage: number;
  marque?: string;
  modele?: string;
  annee?: number;
  titre?: string;
  image?: string;
  localisation?: string;
  carburant?: string;
  transmission?: string;
  lien?: string;
  dealScore?: number;
  score_confiance?: number;
  gain_potentiel?: number;
  tags?: string[]; // Les tags experts sont ici
}

interface Report {
  id: string;
  created_at: string;
  marque: string; 
  modele: string; 
  annee: number | null; 
  kilometrage: number | null; 
  prix_affiche: number | null; 
  prix_moyen: number | null;
  prix_truffe: number | null;
  lien_annonce: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  expert_opinion: string | null;
  negotiation_arguments: string | null;
  negotiation_points: any[] | null;
  vehicles_data: VehicleData[] | null;
  total_vehicules: number | null;
}

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // État pour afficher la liste complète
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
      if (error || !data) { navigate('/client-dashboard'); return; }
      setReport(data as unknown as Report);
      setLoading(false);
    };
    fetchReport();
  }, [id, navigate]);

  useEffect(() => {
    if (showAllVehicles && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showAllVehicles]);

  const vehiclesData = useMemo(() => report?.vehicles_data as VehicleData[] || [], [report]);
  const trendLine = useMemo(() => calculateLogTrendLine(vehiclesData), [vehiclesData]);
  const vehiculeCible = useMemo(() => vehiclesData.length > 0 ? [...vehiclesData].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0))[0] : null, [vehiclesData]);
  const topOpportunities = useMemo(() => vehiclesData.length > 0 ? [...vehiclesData].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0)).slice(0, 5) : [], [vehiclesData]);

  const stats = useMemo(() => {
    if (!report) return null;
    const prixMarche = Number(report.prix_moyen || 0);
    const prixCible = vehiculeCible ? Number(vehiculeCible.prix || 0) : prixMarche;
    const economy = prixMarche > 0 ? prixMarche - prixCible : 0;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    const score = vehiculeCible ? Math.min(98, Math.max(10, Number(vehiculeCible.dealScore || vehiculeCible.score_confiance || 50))) : 50;
    return { prixMarche, prixCible, economy, percentEconomy, score, isGoodDeal: economy > 0, totalVehicules: report.total_vehicules || vehiclesData.length };
  }, [report, vehiculeCible, vehiclesData]);

  const negotiationPoints = useMemo(() => {
    if (!report) return [];
    if (report.negotiation_points && Array.isArray(report.negotiation_points)) return report.negotiation_points;
    if (report.expert_opinion?.includes("|||DATA|||")) { try { return JSON.parse(report.expert_opinion.split("|||DATA|||")[1]); } catch (e) {} }
    if (report.negotiation_arguments) {
        return report.negotiation_arguments.split('\n').filter(l => l.trim()).map(l => ({ titre: l.split(':')[0] || "Argument", desc: l.split(':')[1] || l }));
    }
    return [{ titre: "Analyse en attente", desc: "Les arguments sont en cours de rédaction." }];
  }, [report, stats]);

  const cleanExpertOpinion = useMemo(() => report?.expert_opinion ? report.expert_opinion.split("|||DATA|||")[0] : "Analyse en cours...", [report]);

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    toast({ title: "Génération...", description: "Création du rapport optimisé." });
    await new Promise(r => setTimeout(r, 500));
    const fileName = `Rapport_LaTruffe_${report.marque}_${report.modele}`.replace(/\s+/g, '_');
    const success = await generatePDF('report-content', fileName);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès !", description: "Le PDF a été généré.", className: "bg-green-600 text-white border-0" });
    else toast({ title: "Erreur", description: "Échec de la génération.", variant: "destructive" });
  };

  if (loading || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-slate-500 font-medium">Chargement...</p></div>;
  if (!report || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-normal no-print pdf-hide">Audit Certifié</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')} className="h-9 px-3"><ArrowLeft className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Retour</span></Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="hidden sm:flex h-9 bg-slate-900 hover:bg-slate-800 text-white">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />} {isGeneratingPdf ? "..." : "Télécharger PDF"}
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENU DU RAPPORT */}
      <main id="report-content" className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl bg-[#F8F9FA]">
        
        {/* --- SECTION 1 : EN-TÊTE --- */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 pdf-section">
          <div className="w-full md:w-1/3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group bg-slate-100">
              <img src={vehiculeCible?.image || `https://source.unsplash.com/1600x900/?car,${report.marque}`} alt={vehiculeCible?.titre} className="w-full h-full object-cover object-center" onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/1600x900/?car,${report.marque}`; }} />
              <div className="absolute top-3 right-3"><Badge className={`${stats.isGoodDeal ? 'bg-green-500' : 'bg-orange-500'} text-white px-3 py-1 shadow-md border-0`}>{stats.isGoodDeal ? 'Excellent Deal' : 'Prix Marché'}</Badge></div>
            </div>
          </div>
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 leading-tight">{report.marque} {report.modele}</h1>
                  <p className="text-slate-500 flex items-center gap-2 text-sm line-clamp-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium shrink-0">{report.annee}</span>
                    <span className="truncate">• {vehiculeCible?.titre || `${report.marque} ${report.modele}`}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <div className="text-3xl font-bold text-slate-900">{safeNum(vehiculeCible?.prix || stats.prixMarche)} €</div>
                  <div className="text-sm text-slate-500">Meilleur prix trouvé</div>
                </div>
              </div>
              <Separator className="my-4 hidden md:block" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Gauge className="w-5 h-5" /></div><div className="min-w-0"><p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold truncate">Kilométrage</p><p className="font-bold text-slate-900 truncate">{safeNum(vehiculeCible?.kilometrage)} km</p></div></div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0"><Fuel className="w-5 h-5" /></div><div className="min-w-0"><p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold truncate">Carburant</p><p className="font-bold text-slate-900 capitalize truncate">{vehiculeCible?.carburant || 'N/A'}</p></div></div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0"><Calendar className="w-5 h-5" /></div><div className="min-w-0"><p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold truncate">Année</p><p className="font-bold text-slate-900 truncate">{vehiculeCible?.annee}</p></div></div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0"><ShieldCheck className="w-5 h-5" /></div><div className="min-w-0"><p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold truncate">Score</p><p className="font-bold text-slate-900 truncate">{stats.score}/100</p></div></div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 print:hidden">
              <Button className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-base md:text-lg no-print pdf-hide" onClick={() => { const link = vehiculeCible?.lien || report.lien_annonce; if (link) window.open(link, '_blank'); }}>Voir l'annonce</Button>
              <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center border-slate-300 no-print pdf-hide"><Share2 className="w-5 h-5 text-slate-600" /></Button>
            </div>
          </div>
        </div>

        {/* --- SECTION 2 : VERDICT --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 pdf-section">
          <Card className="md:col-span-1 border-slate-200 shadow-md bg-white overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${stats.isGoodDeal ? 'from-green-400 to-emerald-600' : 'from-orange-400 to-amber-600'}`} />
            <CardContent className="p-6 text-center">
              <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-4">Score La Truffe</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-28 h-28 md:w-32 md:h-32" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * stats.score) / 100} className={stats.isGoodDeal ? 'text-green-500' : 'text-orange-500'} transform="rotate(-90 64 64)" />
                </svg>
                <span className="absolute text-3xl md:text-4xl font-extrabold text-slate-900">{stats.score}</span>
              </div>
              <p className={`mt-4 font-bold text-lg flex items-center justify-center gap-2 ${stats.isGoodDeal ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.isGoodDeal ? <><CheckCircle2 className="w-5 h-5" /> Bonne affaire</> : <><AlertTriangle className="w-5 h-5" /> Prix standard</>}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-slate-200 shadow-md bg-white">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Euro className="w-5 h-5 text-primary" /> Analyse Financière</CardTitle></CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div><p className="text-sm text-slate-500 mb-1">Prix moyen du marché</p><p className="text-2xl font-bold text-slate-900">{safeNum(stats.prixMarche)} €</p></div>
                <div className="text-left sm:text-right"><p className="text-sm text-slate-500 mb-1">Économie potentielle</p><p className={`text-2xl font-bold ${stats.economy > 0 ? 'text-green-600' : 'text-orange-500'}`}>{stats.economy > 0 ? '-' : '+'}{safeNum(Math.abs(stats.economy))} €</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium"><span>Positionnement Prix</span><span className={stats.isGoodDeal ? "text-green-600" : "text-orange-600"}>{stats.isGoodDeal ? "Sous la cote" : "Au-dessus de la cote"}</span></div>
                  <Progress value={Math.min(100, Math.max(0, 50 - stats.percentEconomy))} className="h-2.5 bg-slate-100" />
                </div>
                {stats.economy > 0 && <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-3 items-start"><AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" /><p><strong>Attention :</strong> Le prix est attractif (-{Math.abs(stats.percentEconomy)}%), vérifiez bien l'historique.</p></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- SECTION 3 : GRAPHIQUE SNIPER (LOG) --- */}
        {vehiclesData.length > 0 && (
          <div className="mb-8 pdf-section">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingDown className="w-6 h-6 text-primary" /> Analyse du Marché</h2>
            <Card className="shadow-lg border-slate-200 overflow-hidden h-[350px] md:h-[500px]">
              <CardContent className="p-2 md:p-4 h-full">
                <SniperChart data={vehiclesData as any} trendLine={trendLine} onVehicleClick={(vehicle) => { setSelectedVehicle(vehicle as unknown as VehicleData); }} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- SECTION 4 : TOP 5 DES ALTERNATIVES --- */}
        {topOpportunities.length > 0 && (
           <div className="mb-12 pdf-section">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Les 5 Meilleures Alternatives
            </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 top5-grid">
              {topOpportunities.map((deal, idx) => (
                 <Card key={idx} className="overflow-hidden border-slate-200 shadow-sm">
                   <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 print:aspect-auto print:h-32">
                    <img 
                      src={deal.image || "/placeholder.svg"} 
                      alt={deal.titre}
                       className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${report.marque}`; }}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-slate-900 hover:bg-white font-bold shadow-sm">#{idx + 1}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                     <h3 className="font-bold text-slate-900 truncate mb-1">{deal.titre}</h3>
                     {/* Tags emoji */}
                     {deal.tags && deal.tags.length > 0 && (
                       <div className="flex flex-wrap gap-1 mb-2">
                         {deal.tags.map((tag, tidx) => (
                           <span key={tidx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{tag}</span>
                         ))}
                       </div>
                     )}
                     <div className="flex justify-between items-end mb-3">
                       <div>
                         <p className="text-2xl font-bold text-primary">{safeNum(deal.prix)} €</p>
                         <p className="text-xs text-slate-500">{safeNum(deal.kilometrage)} km • {deal.annee}</p>
                       </div>
                       <div className="text-right">
                         <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                           {Math.round(100 - (deal.prix / (report.prix_moyen || 1) * 100))}% sous la cote
                         </Badge>
                       </div>
                     </div>
                     <Button variant="default" className="w-full bg-slate-900 hover:bg-slate-800 print:hidden no-print pdf-hide" onClick={() => window.open(deal.lien, '_blank')}>Voir l'annonce</Button>
                  </CardContent>
                </Card>
              ))}
              
               {/* CARTE DÉCLENCHEUR - Masquée dans le PDF */}
              <Card 
                 className="flex flex-col items-center justify-center p-10 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 cursor-pointer group shadow-2xl border-0 h-full min-h-[450px] print:hidden no-print pdf-hide"
                onClick={() => setShowAllVehicles(true)}
              >
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border-2 border-white/20 shadow-inner">
                  <ListFilter className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-extrabold text-4xl text-center mb-4 tracking-tight">Voir tout le marché</h3>
                <p className="text-slate-300 text-center text-lg mb-10 max-w-xs leading-relaxed font-medium">
                  Ce rapport contient <span className="text-white font-bold">{stats.totalVehicules} annonces</span> au total. Cliquez pour afficher la liste complète.
                </p>
                <Button variant="secondary" size="lg" className="w-full max-w-[280px] h-14 text-lg font-bold shadow-xl hover:scale-105 transition-transform pointer-events-none">Afficher la liste complète</Button>
              </Card>
            </div>
          </div>
        )}

        {/* --- NOUVELLE SECTION : LISTE COMPLÈTE (VERSION GALERIE + TAGS) --- */}
        {showAllVehicles && (
          <div ref={tableRef} className="mb-12 animate-in fade-in slide-in-from-bottom-10 duration-500 scroll-mt-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Search className="w-8 h-8 text-primary" /> 
                Liste complète ({stats.totalVehicules} annonces)
              </h3>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher (titre, année, prix...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-xl bg-white">
              <div className="max-h-[800px] overflow-auto">
                <Table>
                  <TableHeader className="bg-slate-100 sticky top-0 z-10 h-14">
                    <TableRow>
                      <TableHead className="w-[180px] pl-6 font-bold text-slate-700">Photo</TableHead>
                      <TableHead className="font-bold text-slate-700">Véhicule</TableHead>
                      <TableHead className="font-bold text-slate-700 text-lg">Prix</TableHead>
                      <TableHead className="font-bold text-slate-700">Kilométrage</TableHead>
                      <TableHead className="font-bold text-slate-700">Année</TableHead>
                      <TableHead className="font-bold text-slate-700">Score</TableHead>
                      <TableHead className="text-right pr-6 font-bold text-slate-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiclesData
                      .filter(vehicle => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          (vehicle.titre || '').toLowerCase().includes(q) ||
                          String(vehicle.prix).includes(q) ||
                          String(vehicle.annee).includes(q) ||
                          String(vehicle.kilometrage).includes(q) ||
                          (vehicle.localisation || '').toLowerCase().includes(q) ||
                          (vehicle.carburant || '').toLowerCase().includes(q) ||
                          (vehicle.tags || []).some(t => t.toLowerCase().includes(q))
                        );
                      })
                      .sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0))
                      .map((vehicle, i) => {
                      // Récupération des tags existants
                      const tags = vehicle.tags || []; 
                      const isSuspicious = tags.includes('FRAUDE') || tags.includes('DANGER') || (vehicle.dealScore || 0) >= 95;

                      return (
                        <TableRow key={i} className={`transition-colors border-b border-slate-100 ${isSuspicious ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-blue-50/50'}`}>
                          {/* 1. PHOTO XXL */}
                          <TableCell className="pl-6 py-6 w-[220px]">
                            <div className="w-48 h-32 bg-slate-200 rounded-lg overflow-hidden shadow-md border border-slate-200 relative group">
                              <img 
                                src={vehicle.image || "/placeholder.svg"} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                alt="v" 
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${report.marque}`; }}
                              />
                              {isSuspicious && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 animate-pulse">
                                  ⚠️ VÉRIFIER
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* INFOS + BADGES */}
                          <TableCell className="py-6 align-middle">
                            <div className="flex flex-col gap-2">
                              <div className="font-bold text-xl text-slate-900 line-clamp-1">{vehicle.titre}</div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mb-1">
                                <Badge variant="outline" className="font-normal bg-slate-50 text-slate-600 border-slate-200">{vehicle.annee}</Badge>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {vehicle.localisation || "France"}</span>
                              </div>
                              {/* TAGS */}
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag, idx) => (
                                  <Badge key={idx} className={`text-[10px] px-2 py-0.5 font-bold shadow-sm border ${getTagStyle(tag)}`}>
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* 3. PRIX */}
                          <TableCell className="py-6 align-middle">
                            <div className={`font-extrabold text-2xl whitespace-nowrap ${isSuspicious ? 'text-red-600' : 'text-primary'}`}>
                              {safeNum(vehicle.prix)} €
                            </div>
                            {isSuspicious && <div className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Prix Suspect</div>}
                            {tags.includes('FLIP') && <div className="text-xs text-emerald-600 font-bold mt-1">Gros potentiel</div>}
                          </TableCell>
                          
                          <TableCell className="text-lg font-medium text-slate-700 py-6 align-middle whitespace-nowrap">
                            {safeNum(vehicle.kilometrage)} km
                          </TableCell>
                          
                          <TableCell className="text-base font-medium text-slate-700 py-6 align-middle">
                            {vehicle.annee}
                          </TableCell>
                          
                          <TableCell className="py-6 align-middle">
                            <div className="flex flex-col items-center">
                              <Badge className={`text-sm px-3 py-1 mb-1 ${vehicle.dealScore && vehicle.dealScore > 80 ? (isSuspicious ? "bg-red-600" : "bg-green-600") : "bg-slate-500"}`}>
                                {vehicle.dealScore || 50}/100
                              </Badge>
                              {(tags.includes('COLLECTION') || tags.includes('FLIP')) && (
                                <span className="text-xs font-bold text-yellow-500 flex items-center">⭐ Star</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right pr-6 py-6 align-middle">
                            <Button size="lg" className={`font-semibold shadow-sm h-12 px-6 ${isSuspicious ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`} onClick={() => window.open(vehicle.lien, '_blank')}>
                              {isSuspicious ? 'Inspecter' : 'Voir l\'annonce'} <ExternalLink className="ml-2 w-4 h-4" />
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

        {/* --- SECTION 5 : AVIS --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 pdf-section">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-primary shadow-sm h-full">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-line text-justify">"{cleanExpertOpinion}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">JD</div>
                  <div><p className="text-sm font-bold text-slate-900">Julien D.</p><p className="text-xs text-slate-500">Analyste Automobile Senior</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Arguments de négociation</h2>
            <Card className="shadow-sm h-full negotiation-card bg-white border border-slate-200">
              <CardContent className="p-6 bg-white">
                <ul className="space-y-6">
                  {negotiationPoints.map((arg: any, index: number) => (
                    <li key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 font-bold text-sm border border-green-200">{index + 1}</div>
                      <div><p className="text-sm text-slate-700 leading-snug pdf-text-left"><strong className="text-slate-900 block mb-1">{arg.titre}</strong>{arg.desc}</p></div>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 bg-slate-900 hover:bg-slate-800 print:hidden no-print pdf-hide" onClick={() => navigate('/client-dashboard')}><Search className="w-4 h-4 mr-2" /> Demander un autre audit</Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
};

export default ReportView;