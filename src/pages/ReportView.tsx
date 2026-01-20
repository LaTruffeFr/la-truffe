import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Gauge,
  Fuel,
  Euro,
  ShieldCheck,
  Loader2,
} from "lucide-react";

// Imports des composants graphiques et données
import { SniperChart } from "@/components/trading/SniperChart";
import { VehicleWithScore } from "@/lib/csvParser"; // Assure-toi que ce fichier existe
import { getDemoReport, isDemoReport } from "@/data/demoData";

// --- TYPES ---
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

// Fonction mathématique pour la ligne de tendance
function calculateTrendLine(data: VehicleWithScore[]): { slope: number; intercept: number } {
  if (data.length < 2) return { slope: 0, intercept: 0 };
  const n = data.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  data.forEach((v) => {
    sumX += v.kilometrage;
    sumY += v.prix;
    sumXY += v.kilometrage * v.prix;
    sumXX += v.kilometrage * v.kilometrage;
  });
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDemo = id ? isDemoReport(id) : false;

  const [report, setReport] = useState<Report | null>(null);
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    // Cas DÉMO
    if (isDemo && id) {
      const demoReport = getDemoReport(id);
      if (demoReport) {
        setReport(demoReport as unknown as Report);
        setVehicles(demoReport.vehicles_data);
      }
      setIsLoading(false);
    }
  }, [isDemo, id]);

  useEffect(() => {
    // Cas RÉEL (Supabase)
    if (isDemo || !user || !id) return;

    const fetchData = async () => {
      setIsLoading(true);

      const { data: reportData, error } = await supabase.from("reports").select("*").eq("id", id).single();

      if (error || !reportData) {
        toast({ title: "Erreur", description: "Rapport introuvable", variant: "destructive" });
        navigate("/client-dashboard");
        return;
      }

      const report = reportData as unknown as Report;
      setReport(report);

      if (report.vehicles_data && Array.isArray(report.vehicles_data)) {
        // Normalisation des données pour éviter les bugs
        const enrichedVehicles = report.vehicles_data.map((v, index) => ({
          ...v,
          id: v.id || `vehicle-${index}`,
          dealScore: v.dealScore || 50,
          ecartEuros: v.ecartEuros || 0,
        })) as VehicleWithScore[];

        setVehicles(enrichedVehicles);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user, id, toast, navigate, isDemo]);

  // --- 2. CALCULS KPI ---
  const trendLine = useMemo(() => calculateTrendLine(vehicles), [vehicles]);

  // Trouver la meilleure affaire (triée par score)
  const bestDeal = useMemo(() => {
    if (vehicles.length === 0) return null;
    return [...vehicles].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0))[0];
  }, [vehicles]);

  const stats = useMemo(() => {
    if (!report || vehicles.length === 0 || !bestDeal) return null;

    const avgPrice = report.prix_moyen || vehicles.reduce((acc, v) => acc + v.prix, 0) / vehicles.length;
    const economy = Math.max(0, avgPrice - bestDeal.prix);
    const percentEconomy = Math.round((economy / avgPrice) * 100);
    const score = bestDeal.dealScore || 50;
    const isGoodDeal = score > 70;

    return { avgPrice, economy, percentEconomy, score, isGoodDeal };
  }, [report, vehicles, bestDeal]);

  const handlePrint = () => {
    toast({ title: "Impression", description: "Préparation du document..." });
    setTimeout(() => window.print(), 500);
  };

  // --- 3. AFFICHAGE ETATS D'ATTENTE ---
  if (isLoading || (!isDemo && authLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
        <p className="text-slate-500 font-medium animate-pulse">Analyse du marché en temps réel...</p>
      </div>
    );
  }

  if (!report || !bestDeal || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyse en cours</h2>
        <p className="text-slate-500 max-w-md">
          Nos algorithmes scannent le marché pour {report?.marque} {report?.modele}. Revenez dans quelques instants.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/client-dashboard")}>
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  // --- 4. RENDU VISUEL (DESIGN DÉMO) ---
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900 print:bg-white">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-2">
            La Truffe{" "}
            <Badge variant="secondary" className="text-xs font-normal">
              Audit Certifié
            </Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/client-dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button size="sm" onClick={handlePrint} className="hidden sm:flex bg-slate-900 hover:bg-slate-800">
              <Download className="w-4 h-4 mr-2" /> Télécharger PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* --- SECTION HÉROS (VÉHICULE STAR) --- */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Image */}
          <div className="w-full md:w-1/3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group bg-slate-100">
              {/* Image dynamique Unsplash basée sur la marque */}
              <img
                src={`https://source.unsplash.com/800x600/?car,${report.marque}`}
                alt={`${report.marque} ${report.modele}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                {/* Fallback text si l'image ne charge pas vite */}
              </div>

              <div className="absolute top-3 right-3 z-10">
                <Badge
                  className={`${stats.isGoodDeal ? "bg-green-500" : "bg-orange-500"} text-white px-3 py-1 shadow-md border-0`}
                >
                  {stats.isGoodDeal ? "Excellent Deal" : "Offre Correcte"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Infos Détails */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
                    {report.marque} {report.modele}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 text-sm">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                      {bestDeal.annee}
                    </span>
                    • {bestDeal.titre || `${report.marque} ${report.modele}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{bestDeal.prix.toLocaleString()} €</div>
                  <div className="text-sm text-slate-500">Prix analysé</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Kilométrage</p>
                    <p className="font-bold text-slate-900">{bestDeal.kilometrage.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Carburant</p>
                    <p className="font-bold text-slate-900">N/A</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                    <p className="font-bold text-slate-900">{bestDeal.annee}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Confiance</p>
                    <p className="font-bold text-slate-900">{Math.round(stats.score)}/100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg"
                onClick={() => {
                  // CORRECTION ICI : On gère le cas où le lien n'existe pas ou le type est incomplet
                  const target = bestDeal as any;
                  const url = target.link || target.url || target.annonce_link;

                  if (url) {
                    window.open(url, "_blank");
                  } else {
                    toast({
                      title: "Lien non disponible",
                      description: "L'URL de cette annonce n'a pas été fournie dans les données.",
                      variant: "destructive", // Affiche une erreur rouge
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
        <div className="grid md:grid-cols-3 gap-6 mb-8 page-break-inside-avoid">
          {/* Carte Score Circulaire */}
          <Card className="md:col-span-1 border-slate-200 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
            <CardContent className="p-6 text-center">
              <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-4">Score La Truffe</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={351}
                    strokeDashoffset={351 - (351 * stats.score) / 100}
                    className={`${stats.isGoodDeal ? "text-green-500" : "text-orange-500"} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-slate-900">{Math.round(stats.score)}</span>
              </div>
              <p
                className={`mt-4 font-bold text-lg flex items-center justify-center gap-2 ${stats.isGoodDeal ? "text-green-600" : "text-orange-600"}`}
              >
                {stats.isGoodDeal ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Très bonne affaire
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" /> Prix standard
                  </>
                )}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Ce véhicule est mieux placé que {Math.round(stats.score)}% du marché.
              </p>
            </CardContent>
          </Card>

          {/* Carte Analyse Financière */}
          <Card className="md:col-span-2 border-slate-200 shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Euro className="w-5 h-5 text-blue-600" /> Analyse Financière
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
                  <p className={`text-2xl font-bold ${stats.economy > 0 ? "text-green-600" : "text-slate-400"}`}>
                    {stats.economy > 0 ? "-" : ""}
                    {Math.round(stats.economy).toLocaleString()} €
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>Positionnement Prix</span>
                    <span className={stats.isGoodDeal ? "text-green-600" : "text-orange-600"}>
                      {stats.isGoodDeal ? "Sous la cote" : "Dans la moyenne"}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, 100 - (bestDeal.prix / stats.avgPrice) * 50))}
                    className="h-2.5 bg-slate-100"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Trop cher</span>
                    <span>Prix Juste</span>
                    <span>Excellente affaire</span>
                  </div>
                </div>

                {stats.percentEconomy > 15 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    <p>
                      <strong>Attention :</strong> Le prix est très attractif (-{stats.percentEconomy}%), vérifiez bien
                      l'historique d'entretien.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAPHIQUE SNIPER --- */}
        <div className="mb-8 page-break-inside-avoid">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-blue-600" /> Analyse du Marché
          </h2>
          <Card className="shadow-lg border-slate-200 overflow-hidden bg-white">
            <CardContent className="p-4 h-[400px]">
              <SniperChart
                data={vehicles}
                trendLine={trendLine}
                onVehicleClick={() => {}} // Désactivé pour la vue client simple
              />
            </CardContent>
          </Card>
        </div>

        {/* --- EXPERTISE & ARGUMENTS --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 page-break-inside-avoid">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed mb-4 italic">
                  "
                  {report.admin_notes ||
                    "Analyse automatique : Ce véhicule présente un positionnement prix très agressif par rapport à la concurrence directe. Le ratio kilométrage/prix est favorable, ce qui en fait une opportunité à saisir rapidement."}
                  "
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    LT
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Expert La Truffe</p>
                    <p className="text-xs text-slate-500">Analyste Automobile</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Arguments de négociation</h2>
            <Card className="shadow-sm bg-white">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <p className="text-sm text-slate-700">
                      <strong>Contexte Marché :</strong> {vehicles.length} véhicules similaires sont en vente. La
                      concurrence est présente.
                    </p>
                  </li>

                  {bestDeal.kilometrage > 90000 && (
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <p className="text-sm text-slate-700">
                        <strong>Kilométrage :</strong> Le véhicule dépasse les 90 000 km. Vérifiez si la grosse révision
                        a été effectuée. Sinon, demandez une baisse.
                      </p>
                    </li>
                  )}

                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      3
                    </div>
                    <p className="text-sm text-slate-700">
                      <strong>Décote :</strong> Ce modèle perd environ {Math.round(report.decote_par_10k || 1000)}€ tous
                      les 10 000km. Utilisez cet argument pour la revente future.
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Impression */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white text-center">
        <p className="text-xs text-slate-400">Rapport généré par La Truffe - {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default ReportView;
