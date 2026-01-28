import { useState, useEffect, useMemo } from 'react';
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
  Euro, ShieldCheck, Loader2, Search, ArrowUpRight, MapPin, ExternalLink
} from "lucide-react";

import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

function calculateTrendLine(data: any[]): { slope: number; intercept: number } {
  if (!data || data.length < 2) return { slope: 0, intercept: 0 };
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach(v => {
    const km = v.kilometrage || 0;
    const px = v.prix || 0;
    sumX += km;
    sumY += px;
    sumXY += km * px;
    sumXX += km * km;
  });
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
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
  economie_moyenne: number | null;
  opportunites_count: number | null;
  carburant: string | null;
  transmission: string | null;
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

  const vehiclesData = useMemo(() => report?.vehicles_data as VehicleData[] || [], [report]);
  const trendLine = useMemo(() => calculateTrendLine(vehiclesData), [vehiclesData]);
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
    if (success) {
        toast({ title: "Succès !", description: "Le PDF a été généré.", className: "bg-green-600 text-white border-0" });
    } else {
        toast({ title: "Erreur", description: "Échec de la génération.", variant: "destructive" });
    }
  };

  if (loading || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-slate-500 font-medium">Chargement...</p></div>;
  if (!report || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-normal">Audit Certifié</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')} className="h-9 px-3"><ArrowLeft className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Retour</span></Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="hidden sm:flex h-9 bg-slate-900 hover:bg-slate-800 text-white">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />} 
              {isGeneratingPdf ? "..." : "Télécharger PDF"}
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
              <Button className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-base md:text-lg" onClick={() => { const link = vehiculeCible?.lien || report.lien_annonce; if (link) window.open(link, '_blank'); }}>Voir l'annonce</Button>
              <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center border-slate-300"><Share2 className="w-5 h-5 text-slate-600" /></Button>
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

        {/* --- SECTION 3 : GRAPHIQUE --- */}
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

        {/* --- SECTION 4 : TOP 5 (CORRECTION ÉCART) --- */}
        {topOpportunities.length > 0 && (
          <div className="mb-12">
            <div className="pdf-section">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><ArrowUpRight className="w-6 h-6 text-green-600" /> Top 5 des meilleures opportunités</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {topOpportunities.map((vehicule, index) => {
                // CORRECTION ICI : On utilise d'abord le gain_potentiel (calcul intelligent), sinon la moyenne globale
                const ecart = vehicule.gain_potentiel ?? ((stats.prixMarche || 0) - vehicule.prix);
                
                return (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col md:flex-row cursor-pointer pdf-section" onClick={() => setSelectedVehicle(vehicule)}>
                    {/* Image */}
                    <div className="relative w-full md:w-72 h-48 md:h-auto md:min-h-[16rem] shrink-0 bg-slate-100 border-r border-slate-100">
                      <img src={vehicule.image || `https://source.unsplash.com/1600x900/?car,${report.marque}`} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" alt={vehicule.titre} onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${report.marque}`; }} />
                      <div className="absolute top-0 left-0 bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-br-lg shadow-md z-10">#{index + 1}</div>
                    </div>
                    {/* Infos */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-primary transition-colors">{vehicule.titre || `${report.marque} ${report.modele}`}</h4>
                          <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Gauge className="w-3 h-3" /> {safeNum(vehicule.kilometrage)} km</span>
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Calendar className="w-3 h-3" /> {vehicule.annee}</span>
                            {vehicule.localisation && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><MapPin className="w-3 h-3" /> {vehicule.localisation}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-bold text-slate-900">{safeNum(vehicule.prix)} €</div>
                          {ecart > 0 && <div className="text-xs font-bold text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded inline-block">-{safeNum(ecart)} € sous la cote</div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                        <div className="flex gap-2">
                           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">Score {vehicule.dealScore || 50}/100</Badge>
                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">Fiabilité</Badge>
                        </div>
                        <div className="text-sm font-medium text-slate-400 group-hover:text-slate-900 flex items-center gap-1 transition-colors print:hidden">Voir le détail <ExternalLink className="w-4 h-4" /></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <Card className="shadow-sm h-full">
              <CardContent className="p-6">
                <ul className="space-y-6">
                  {negotiationPoints.map((arg: any, index: number) => (
                    <li key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-sm border border-green-200">{index + 1}</div>
                      <div><p className="text-sm text-slate-700 leading-snug"><strong className="text-slate-900 block mb-1">{arg.titre}</strong>{arg.desc}</p></div>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 bg-slate-900 hover:bg-slate-800 print:hidden" onClick={() => navigate('/client-dashboard')}><Search className="w-4 h-4 mr-2" /> Demander un autre audit</Button>
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