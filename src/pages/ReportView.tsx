import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Download, Share2, CheckCircle2, 
  AlertTriangle, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Search, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TradingDashboard from "@/components/trading/TradingDashboard";
import { getDemoReport, isDemoReport } from "@/data/demoData";
import { Footer } from "@/components/landing";
import { VehicleWithScore } from "@/lib/csvParser";

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  marque: string;
  modele: string;
  status: "pending" | "in_progress" | "completed";
  admin_notes: string | null;
  prix_moyen: number | null;
  decote_par_10k: number | null;
  opportunites_count: number | null;
  vehicles_data: VehicleWithScore[] | null;
}

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDemo = id ? isDemoReport(id) : false;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Chargement des données
  useEffect(() => {
    if (isDemo && id) {
      const demoReport = getDemoReport(id);
      if (demoReport) {
        setReport(demoReport as unknown as Report);
      } else {
        navigate("/");
      }
      setLoading(false);
      return;
    }

    if (!user || !id) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast({ title: "Erreur", description: "Rapport introuvable", variant: "destructive" });
        navigate("/client-dashboard");
        return;
      }

      const reportData = data as unknown as Report;
      
      // Normaliser les véhicules
      if (reportData.vehicles_data && Array.isArray(reportData.vehicles_data)) {
        reportData.vehicles_data = reportData.vehicles_data.map((v, index) => ({
          ...v,
          id: v.id || `vehicle-${index}`,
          dealScore: v.dealScore || 50,
          ecartEuros: v.ecartEuros || 0,
        }));
      }

      setReport(reportData);
      setLoading(false);
    };

    fetchData();
  }, [id, user, authLoading, isDemo, navigate, toast]);

  // Calculs
  const vehicles = report?.vehicles_data || [];
  const vehiculeCible = vehicles[0] || null;
  
  const stats = useMemo(() => {
    if (!report || vehicles.length === 0 || !vehiculeCible) return null;
    
    const avgPrice = report.prix_moyen || vehicles.reduce((acc, v) => acc + v.prix, 0) / vehicles.length;
    const economy = Math.max(0, avgPrice - vehiculeCible.prix);
    const percentEconomy = avgPrice > 0 ? Math.round((economy / avgPrice) * 100) : 0;
    const score = vehiculeCible.dealScore || (economy > 0 ? Math.min(95, 70 + percentEconomy) : 50);
    const isGoodDeal = score > 70;

    return { avgPrice, economy, percentEconomy, score, isGoodDeal };
  }, [report, vehicles, vehiculeCible]);

  const handleDownload = () => {
    toast({
      title: "Téléchargement lancé",
      description: "Votre rapport PDF complet est en cours de génération.",
    });
  };

  // États de chargement
  if (loading || (!isDemo && authLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
        <p className="text-slate-500 font-medium animate-pulse">Analyse du marché en temps réel...</p>
      </div>
    );
  }

  if (!report || !vehiculeCible || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyse en cours</h2>
        <p className="text-slate-500 max-w-md">
          Nos algorithmes scannent le marché. Revenez dans quelques instants.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/client-dashboard")}>
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER NAVIGATION --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-logo font-bold text-2xl tracking-tight text-slate-900">
            La Truffe
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
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group">
              <img 
                src={vehiculeCible.image || `https://source.unsplash.com/800x600/?car,${report.marque}`}
                alt={vehiculeCible.titre || `${report.marque} ${report.modele}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = `https://source.unsplash.com/800x600/?car,${report.marque}`;
                }}
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${stats.isGoodDeal ? 'bg-green-500' : 'bg-orange-500'} text-white px-3 py-1 shadow-md`}>
                  {stats.isGoodDeal ? 'Excellent Deal' : 'Prix Moyen'}
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
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{vehiculeCible.annee || 'N/A'}</span>
                    • {vehiculeCible.titre || `${report.marque} ${report.modele}`} • {vehiculeCible.localisation || 'France'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{vehiculeCible.prix.toLocaleString()} €</div>
                  <div className="text-sm text-slate-500">Prix affiché</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Gauge className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Kilométrage</p>
                    <p className="font-bold text-slate-900">{vehiculeCible.kilometrage.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Fuel className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Carburant</p>
                    <p className="font-bold text-slate-900">{(vehiculeCible as any).carburant || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                    <p className="font-bold text-slate-900">{vehiculeCible.annee || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Fiabilité</p>
                    <p className="font-bold text-slate-900">Élevée</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg"
                onClick={() => {
                  const target = vehiculeCible as any;
                  const url = target.link || target.url || target.lien;
                  if (url) {
                    window.open(url, "_blank");
                  } else {
                    toast({
                      title: "Lien non disponible",
                      description: "L'URL de cette annonce n'a pas été fournie.",
                      variant: "destructive",
                    });
                  }
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
                    className={`${stats.isGoodDeal ? 'text-green-500' : 'text-orange-500'} transition-all duration-1000`}
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-slate-900">{Math.round(stats.score)}</span>
              </div>
              <p className={`mt-4 font-bold text-lg flex items-center justify-center gap-2 ${stats.isGoodDeal ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.isGoodDeal ? (
                  <><CheckCircle2 className="w-5 h-5" /> Très bonne affaire</>
                ) : (
                  <><AlertTriangle className="w-5 h-5" /> Prix standard</>
                )}
              </p>
              <p className="text-slate-500 text-sm mt-1">Ce véhicule est mieux placé que {Math.round(stats.score)}% du marché.</p>
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
                  <p className="text-sm text-slate-500 mb-1">Prix du marché estimé</p>
                  <p className="text-2xl font-bold text-slate-900">{Math.round(stats.avgPrice).toLocaleString()} €</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Économie potentielle</p>
                  <p className={`text-2xl font-bold ${stats.economy > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    {stats.economy > 0 ? '-' : ''}{Math.round(stats.economy).toLocaleString()} €
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>Positionnement Prix</span>
                    <span className={stats.isGoodDeal ? 'text-green-600' : 'text-orange-600'}>
                      {stats.isGoodDeal ? 'Sous la cote' : 'Dans la moyenne'}
                    </span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, 100 - (vehiculeCible.prix / stats.avgPrice) * 50))} className="h-2.5 bg-slate-100" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Très bas</span>
                    <span>Moyen</span>
                    <span>Élevé</span>
                  </div>
                </div>
                
                {stats.percentEconomy > 10 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    <p>
                      <strong>Attention :</strong> Le prix est attractif (-{stats.percentEconomy}%), vérifiez bien l'historique d'entretien et l'absence d'accident.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAPHIQUES (LE DASHBOARD) --- */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-primary" /> Analyse du Marché
          </h2>
          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <TradingDashboard 
                data={vehicles} 
                marketStats={{
                  averagePrice: stats.avgPrice,
                  vehicleCount: vehicles.length,
                  lowestPrice: Math.min(...vehicles.map(v => v.prix)),
                  highestPrice: Math.max(...vehicles.map(v => v.prix)),
                  brand: report.marque,
                  model: report.modele
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* --- ARGUMENTS DE NÉGOCIATION --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="p-6">
                {report.admin_notes ? (
                  <p className="text-slate-700 leading-relaxed">{report.admin_notes}</p>
                ) : (
                  <>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      "Cette {report.marque} {report.modele} présente un rapport qualité/prix intéressant par rapport au marché actuel. Le kilométrage affiché est cohérent avec l'année du véhicule."
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      "Nous vous recommandons de vérifier l'historique d'entretien complet et de faire inspecter le véhicule par un professionnel avant l'achat."
                    </p>
                  </>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">LT</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Équipe La Truffe</p>
                    <p className="text-xs text-slate-500">Analystes Automobile</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Arguments de négociation</h2>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                    <p className="text-sm text-slate-700">
                      <strong>Entretien récent :</strong> Vérifiez les factures et le carnet d'entretien. Un entretien non fait peut justifier une remise de 500-1000€.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm text-slate-700">
                      <strong>État des pneus :</strong> Des pneus usés représentent un coût de 300-800€ selon le modèle. Négociez en conséquence.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                    <p className="text-sm text-slate-700">
                      <strong>Délai de paiement :</strong> Un paiement comptant immédiat peut justifier une remise de 2-5% du prix affiché.
                    </p>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  <Search className="w-4 h-4 mr-2" /> Voir les annonces concurrentes
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
