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
  Euro, ShieldCheck, Loader2, Search
} from "lucide-react";

import TradingDashboard from '@/components/trading/TradingDashboard';
import { Footer } from '@/components/landing';

// Fonction utilitaire pour formater les nombres
const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

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

  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      setLoading(true);

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
        navigate('/client-dashboard');
        return;
      }

      setReport(data as unknown as Report);
      setLoading(false);
    };
    
    fetchReport();
  }, [id, navigate]);

  // Données des véhicules parsées
  const vehiclesData = useMemo(() => {
    if (!report?.vehicles_data) return [];
    return report.vehicles_data as VehicleData[];
  }, [report]);

  // Premier véhicule = annonce principale (ou le meilleur deal)
  const vehiculeCible = useMemo(() => {
    if (vehiclesData.length === 0) return null;
    // Trier par dealScore décroissant pour trouver la meilleure opportunité
    const sorted = [...vehiclesData].sort((a, b) => 
      (b.dealScore || b.score_confiance || 0) - (a.dealScore || a.score_confiance || 0)
    );
    return sorted[0];
  }, [vehiclesData]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!report) return null;

    const prixMarche = Number(report.prix_moyen || 0);
    const prixCible = vehiculeCible ? Number(vehiculeCible.prix || 0) : prixMarche;
    const economy = prixMarche > 0 ? prixMarche - prixCible : 0;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    
    // Score basé sur le meilleur deal trouvé
    const score = vehiculeCible 
      ? Math.min(98, Math.max(10, Number(vehiculeCible.dealScore || vehiculeCible.score_confiance || 50)))
      : 50;

    return { 
      prixMarche, 
      prixCible,
      economy, 
      percentEconomy, 
      score, 
      isGoodDeal: economy > 0,
      totalVehicules: report.total_vehicules || vehiclesData.length,
      opportunites: report.opportunites_count || 0,
    };
  }, [report, vehiculeCible, vehiclesData]);

  const handleDownload = () => {
    toast({
      title: "Téléchargement lancé",
      description: "Votre rapport PDF est en cours de génération.",
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement du rapport...</p>
      </div>
    );
  }

  if (!report || !stats) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="text-xs font-normal">Audit Certifié</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button size="sm" onClick={handleDownload} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" /> Télécharger PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        
        {/* --- EN-TÊTE DU VÉHICULE --- */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group bg-slate-100">
              <img 
                src={vehiculeCible?.image || `https://source.unsplash.com/800x600/?car,${report.marque}`}
                alt={vehiculeCible?.titre || `${report.marque} ${report.modele}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = `https://source.unsplash.com/800x600/?car,${report.marque}`;
                }}
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${stats.isGoodDeal ? 'bg-green-500' : 'bg-orange-500'} text-white px-3 py-1 shadow-md border-0`}>
                  {stats.isGoodDeal ? 'Excellent Deal' : 'Prix Marché'}
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
                    {report.annee && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{report.annee}</span>}
                    {vehiculeCible && (
                      <>
                        • {vehiculeCible.titre?.substring(0, 50) || `${report.marque} ${report.modele}`}
                        {vehiculeCible.localisation && ` • ${vehiculeCible.localisation}`}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">
                    {safeNum(vehiculeCible?.prix || stats.prixMarche)} €
                  </div>
                  <div className="text-sm text-slate-500">Meilleur prix trouvé</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Gauge className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Kilométrage</p>
                    <p className="font-bold text-slate-900">{safeNum(vehiculeCible?.kilometrage || report.kilometrage)} km</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Fuel className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Carburant</p>
                    <p className="font-bold text-slate-900 capitalize">{vehiculeCible?.carburant || report.carburant || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                    <p className="font-bold text-slate-900">{vehiculeCible?.annee || report.annee || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
                    <p className="font-bold text-slate-900">{stats.score}/100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <Button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg"
                onClick={() => {
                  const link = vehiculeCible?.lien || report.lien_annonce;
                  if (link) window.open(link, '_blank');
                  else toast({ description: "Lien non disponible" });
                }}
              >
                Voir l'annonce originale
              </Button>
              <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center border-slate-300">
                <Share2 className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* --- VERDICT TRUFFE --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Carte Score */}
          <Card className="md:col-span-1 border-slate-200 shadow-md bg-white overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${stats.isGoodDeal ? 'from-green-400 to-emerald-600' : 'from-orange-400 to-amber-600'}`} />
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
                    className={stats.isGoodDeal ? 'text-green-500' : 'text-orange-500'} 
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-slate-900">{stats.score}</span>
              </div>
              <p className={`mt-4 font-bold text-lg flex items-center justify-center gap-2 ${stats.isGoodDeal ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.isGoodDeal ? <><CheckCircle2 className="w-5 h-5" /> Bonne affaire</> : <><AlertTriangle className="w-5 h-5" /> Prix standard</>}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {stats.totalVehicules} véhicules analysés sur le marché.
              </p>
            </CardContent>
          </Card>

          {/* Carte Analyse Prix */}
          <Card className="md:col-span-2 border-slate-200 shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Euro className="w-5 h-5 text-primary" /> Analyse Financière
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Prix moyen du marché</p>
                  <p className="text-2xl font-bold text-slate-900">{safeNum(stats.prixMarche)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Économie potentielle</p>
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
                      {stats.isGoodDeal ? "Sous la cote" : "Au-dessus de la cote"}
                    </span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, 50 - stats.percentEconomy))} className="h-2.5 bg-slate-100" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Très bas</span>
                    <span>Moyen</span>
                    <span>Élevé</span>
                  </div>
                </div>
                
                {stats.economy > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    <p>
                      <strong>Attention :</strong> Le prix est attractif (-{Math.abs(stats.percentEconomy)}%), vérifiez bien l'historique d'entretien et l'absence d'accident.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAPHIQUES COMPLET (TradingDashboard) --- */}
        {vehiclesData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" /> Analyse du Marché
            </h2>
            <Card className="shadow-lg border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <TradingDashboard 
                  data={vehiclesData as any} 
                  marketStats={{
                    averagePrice: stats.prixMarche,
                    vehicleCount: vehiclesData.length,
                    lowestPrice: Math.min(...vehiclesData.map(v => v.prix)),
                    highestPrice: Math.max(...vehiclesData.map(v => v.prix)),
                    brand: report.marque,
                    model: report.modele
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- AVIS EXPERT & ARGUMENTS --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-primary shadow-sm h-full">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed mb-4 italic">
                  "{report.expert_opinion || `Analyse du marché ${report.marque} ${report.modele} : ${stats.totalVehicules} véhicules ont été analysés. Le prix moyen du marché est de ${safeNum(stats.prixMarche)}€. ${stats.isGoodDeal ? 'Des opportunités intéressantes ont été identifiées.' : 'Les prix sont globalement cohérents avec le marché.'}`}"
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Résumé de l'analyse</h2>
            <Card className="shadow-sm h-full">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                    <p className="text-sm text-slate-700">
                      <strong>Véhicules analysés :</strong> {stats.totalVehicules} annonces scannées sur le marché français.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm text-slate-700">
                      <strong>Prix moyen :</strong> {safeNum(stats.prixMarche)} € pour ce segment.
                    </p>
                  </li>
                  {stats.opportunites > 0 && (
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                      <p className="text-sm text-slate-700">
                        <strong>Opportunités :</strong> {stats.opportunites} bonnes affaires identifiées (score &gt; 70).
                      </p>
                    </li>
                  )}
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">{stats.opportunites > 0 ? '4' : '3'}</div>
                    <p className="text-sm text-slate-700">
                      <strong>Meilleur deal :</strong> {vehiculeCible ? `${safeNum(vehiculeCible.prix)}€ (score ${vehiculeCible.dealScore || vehiculeCible.score_confiance}/100)` : 'Non disponible'}
                    </p>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/client-dashboard')}>
                  <Search className="w-4 h-4 mr-2" /> Demander un autre audit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default ReportView;
