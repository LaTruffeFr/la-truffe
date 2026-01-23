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
  Euro, ShieldCheck, Loader2
} from "lucide-react";

import { SniperChart } from '@/components/trading/SniperChart'; 

// --- FONCTION DE SÉCURITÉ ---
// C'est elle qui empêche le crash "toLocaleString of undefined"
const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString();
};

interface VehicleData {
  prix: number;
  kilometrage: number;
  marque?: string;
  modele?: string;
  annee?: number;
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
  prix_estime: number | null;
  lien_annonce: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  expert_opinion: string | null;
  vehicles_data: VehicleData[] | null;
  // Champs calculés
  total_vehicules: number | null;
  economie_moyenne: number | null;
  decote_par_10k: number | null;
  opportunites_count: number | null;
}

function calculateTrendLine(data: VehicleData[]): { slope: number; intercept: number } {
  if (!data || data.length < 2) return { slope: 0, intercept: 0 };
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach(v => {
    const km = Number(v.kilometrage || (v as any).mileage || 0);
    const px = Number(v.prix || (v as any).price || 0);
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

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      setLoading(true);
      console.log("🔍 Fetching ID:", id);

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error("❌ Erreur Supabase:", error);
        setLoading(false);
        return;
      }
      
      if (!data) {
        console.warn("⚠️ Pas de rapport trouvé");
        navigate('/client-dashboard');
        return;
      }

      console.log("✅ Données reçues:", data);
      setReport(data as unknown as Report);
      setLoading(false);
    };
    
    fetchReport();
  }, [id, navigate]);

  const stats = useMemo(() => {
    if (!report) return null;

    // Prix moyen du marché (depuis l'analyse admin)
    const prixMarche = Number(report.prix_moyen || report.prix_estime || 0);
    // Prix affiché sur l'annonce (si renseigné par l'admin)
    const prixPaye = Number(report.prix_affiche || prixMarche);
    const km = Number(report.kilometrage || 0);
    const annee = Number(report.annee || 0);

    // Calcul de l'économie
    const economy = prixMarche > 0 ? prixMarche - prixPaye : 0;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    
    // Score basé sur les données des véhicules ou calcul simple
    const vehiclesData = report.vehicles_data as any[] | null;
    let avgScore = 50;
    if (vehiclesData && vehiclesData.length > 0) {
      const scores = vehiclesData.map(v => Number(v.dealScore || v.score_confiance || 50));
      avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    
    const calculatedScore = Math.min(98, Math.max(10, avgScore));

    return { 
      prixPaye, 
      prixMarche, 
      economy, 
      percentEconomy, 
      score: calculatedScore, 
      isGoodDeal: economy >= 0,
      km,
      annee,
      totalVehicules: report.total_vehicules || (vehiclesData?.length || 0),
      opportunites: report.opportunites_count || 0,
    };
  }, [report]);

  const trendLine = useMemo(() => {
    return report?.vehicles_data ? calculateTrendLine(report.vehicles_data as VehicleData[]) : { slope: 0, intercept: 0 };
  }, [report]);

  const handlePrint = () => window.print();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (!report || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900 print:bg-white">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="text-xs font-normal">Audit Certifié</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button size="sm" onClick={handlePrint} className="hidden sm:flex bg-slate-900 hover:bg-slate-800">
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        
        {/* --- HERO --- */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group bg-slate-100">
                <img 
                    src={`https://source.unsplash.com/800x600/?car,${report.marque},${report.modele}`} 
                    alt="Voiture"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              <div className="absolute top-3 right-3 z-10">
                <Badge className={`${stats.isGoodDeal ? 'bg-green-500' : 'bg-orange-500'} text-white px-3 py-1 shadow-md border-0`}>
                  {stats.isGoodDeal ? 'Excellent Deal' : 'Offre Standard'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{report.marque} {report.modele}</h1>
                  <p className="text-slate-500 flex items-center gap-2 text-sm">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{stats.annee || 'Année N/A'}</span>
                    • {safeNum(stats.km)} km
                  </p>
                </div>
                <div className="text-right">
                  {/* Utilisation de safeNum ici pour éviter le crash */}
                  <div className="text-3xl font-bold text-slate-900">{safeNum(stats.prixPaye)} €</div>
                  <div className="text-sm text-slate-500">Prix affiché</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Gauge className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Kilométrage</p>
                    <p className="font-bold text-slate-900">{safeNum(stats.km)} km</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                    <p className="font-bold text-slate-900">{stats.annee || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Fiabilité</p>
                    <p className="font-bold text-slate-900">Vérifiée</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Fuel className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
                    <p className="font-bold text-slate-900">{safeNum(stats.score)}/100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <Button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg" 
                onClick={() => {
                   const link = report.lien_annonce;
                   if (link) window.open(link, '_blank');
                   else toast({description: "Lien non disponible"});
                }}
              >
                Voir l'annonce originale
              </Button>
            </div>
          </div>
        </div>

        {/* --- SCORE & FINANCE --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 page-break-inside-avoid">
          <Card className="md:col-span-1 border-slate-200 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
            <CardContent className="p-6 text-center">
              <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-4">Score La Truffe</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={351} 
                    strokeDashoffset={351 - (351 * stats.score) / 100} 
                    className={`${stats.isGoodDeal ? 'text-green-500' : 'text-orange-500'} transition-all duration-1000 ease-out`} 
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-slate-900">{safeNum(stats.score)}</span>
              </div>
              <p className={`mt-4 font-bold text-lg flex items-center justify-center gap-2 ${stats.isGoodDeal ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.isGoodDeal ? <><CheckCircle2 className="w-5 h-5" /> Bonne affaire</> : <><AlertTriangle className="w-5 h-5" /> Prix Moyen</>}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-slate-200 shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Euro className="w-5 h-5 text-blue-600" /> Analyse Financière
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Cote estimée</p>
                  <p className="text-2xl font-bold text-slate-900">{safeNum(stats.prixMarche)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Économie / Surcoût</p>
                  <p className={`text-2xl font-bold ${stats.economy > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                     {stats.economy > 0 ? '-' : '+'}{safeNum(Math.abs(stats.economy))} €
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>Positionnement Prix</span>
                    <span className={stats.isGoodDeal ? "text-green-600" : "text-orange-600"}>
                        {stats.isGoodDeal ? "Sous la cote" : "Au dessus de la cote"}
                    </span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, 50 + stats.percentEconomy))} className="h-2.5 bg-slate-100" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Cher</span>
                    <span>Marché</span>
                    <span>Bonne affaire</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAPHIQUE --- */}
        {report.vehicles_data && (report.vehicles_data as any[]).length > 0 ? (
            <div className="mb-8 page-break-inside-avoid">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-blue-600" /> Courbe du Marché ({stats.totalVehicules} véhicules analysés)
              </h2>
              <Card className="shadow-lg border-slate-200 overflow-hidden bg-white">
                <CardContent className="p-4 h-[400px]">
                  <SniperChart 
                     data={report.vehicles_data as any} 
                     trendLine={trendLine}
                     onVehicleClick={() => {}} 
                  />
                </CardContent>
              </Card>
            </div>
        ) : (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
             <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
             <p>Pas de données graphiques disponibles pour ce véhicule.</p>
          </div>
        )}

        {/* --- AVIS EXPERT --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 page-break-inside-avoid">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white h-full">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed mb-4 italic">
                  "{report.expert_opinion || "Analyse : Le prix est cohérent avec le marché."}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">LT</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Expert La Truffe</p>
                    <p className="text-xs text-slate-500">Analyste Automobile</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Points de Négociation</h2>
            <Card className="shadow-sm bg-white h-full">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                    <p className="text-sm text-slate-700">
                      <strong>Comparaison :</strong> {stats.totalVehicules} véhicules analysés sur le marché.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm text-slate-700">
                      <strong>Prix moyen :</strong> {safeNum(stats.prixMarche)} € sur ce segment.
                    </p>
                  </li>
                  {stats.opportunites > 0 && (
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                      <p className="text-sm text-slate-700">
                        <strong>Opportunités :</strong> {stats.opportunites} bonnes affaires identifiées.
                      </p>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ReportView;