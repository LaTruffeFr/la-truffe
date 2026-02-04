import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Download, Share2, CheckCircle2, 
  AlertTriangle, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Search, Trophy, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
// J'utilise le sniper chart comme validé
import { SniperChart } from "@/components/trading/SniperChart";
import { getDemoReport, DemoReport } from "@/data/demoData";
import { Footer } from "@/components/landing";

const DemoReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<DemoReport | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Simulation de chargement
  useEffect(() => {
    const loadData = () => {
      const reportId = id || "demo-1";
      const foundReport = getDemoReport(reportId);

      if (foundReport) {
        setReport(foundReport);
      } else {
        navigate("/");
      }
      setLoading(false);
    };

    setTimeout(loadData, 800);
  }, [id, navigate]);

  const handleDownload = () => {
    toast({
      title: "Téléchargement lancé",
      description: "Votre rapport PDF complet est en cours de génération.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-medium animate-pulse">Analyse du marché en temps réel...</p>
      </div>
    );
  }

  if (!report) return null;

  const vehiculeCible = report.vehicles_data[0];
  const economy = report.prix_moyen - vehiculeCible.prix;
  const isGoodDeal = economy > 0;
  const score = isGoodDeal ? 92 : 45;
  const vehiclesData = report.vehicles_data;

  // Calcul TrendLine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateTrendLine = (data: any[]) => {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0 };
    const sumX = data.reduce((acc, val) => acc + val.kilometrage, 0);
    const sumY = data.reduce((acc, val) => acc + val.prix, 0);
    const sumXY = data.reduce((acc, val) => acc + (val.kilometrage * val.prix), 0);
    const sumXX = data.reduce((acc, val) => acc + (val.kilometrage * val.kilometrage), 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  };
  
  const trendLine = calculateTrendLine(vehiclesData);

  // LOGIQUE TOP 5 : On trie par score (simulé ici par le prix le plus bas pour l'exemple)
  // On exclut le véhicule cible (index 0) pour montrer des alternatives
  const top5Deals = [...vehiclesData]
    .slice(1) // On enlève le premier (le nôtre)
    .sort((a, b) => a.prix - b.prix) // On trie par prix croissant (les meilleures affaires)
    .slice(0, 5); // On garde les 5 premiers

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER --- */}
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
        
        {/* --- FICHE VÉHICULE --- */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group">
              <img 
                src={vehiculeCible.image} 
                alt={vehiculeCible.titre} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${isGoodDeal ? 'bg-green-500' : 'bg-orange-500'} text-white px-3 py-1 shadow-md`}>
                  {isGoodDeal ? 'Excellent Deal' : 'Prix Moyen'}
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
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">2019</span>
                    • {vehiculeCible.titre}
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
                    <p className="font-bold text-slate-900">Essence</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                    <p className="font-bold text-slate-900">{vehiculeCible.annee || 2019}</p>
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
              {/* --- CORRECTION 1 : .lien au lieu de .lien_url --- */}
              <Button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg"
                onClick={() => window.open(vehiculeCible.lien || '#', '_blank')}
              >
                Voir l'annonce originale <ExternalLink className="ml-2 w-4 h-4"/>
              </Button>
              <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center border-slate-300">
                <Share2 className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* --- SCORES & ANALYSE --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1 border-slate-200 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
            <CardContent className="p-6 text-center">
              <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-4">Score La Truffe</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * score) / 100} className="text-green-500" />
                </svg>
                <span className="absolute text-4xl font-extrabold text-slate-900">{score}</span>
              </div>
              <p className="mt-4 font-bold text-green-600 text-lg flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Très bonne affaire
              </p>
              <p className="text-slate-500 text-sm mt-1">Ce véhicule est mieux placé que 85% du marché.</p>
            </CardContent>
          </Card>

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
                  <p className="text-2xl font-bold text-slate-900">{report.prix_moyen.toLocaleString()} €</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Économie potentielle</p>
                  <p className="text-2xl font-bold text-green-600">-{economy.toLocaleString()} €</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>Positionnement Prix</span>
                    <span className="text-green-600">Sous la cote</span>
                  </div>
                  <Progress value={25} className="h-2.5 bg-slate-100" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Très bas</span>
                    <span>Moyen</span>
                    <span>Élevé</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                  <p><strong>Attention :</strong> Le prix est attractif (-{Math.round((economy/report.prix_moyen)*100)}%), vérifiez bien l'historique d'entretien et l'absence d'accident.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAPHIQUE --- */}
        {vehiclesData.length > 0 && (
          <div className="mb-12 pdf-section">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" /> Analyse du Marché
            </h2>
            <Card className="shadow-lg border-slate-200 overflow-hidden h-[350px] md:h-[500px]">
              <CardContent className="p-2 md:p-4 h-full">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <SniperChart 
                  data={vehiclesData} 
                  trendLine={{ type: 'linear', a: trendLine.intercept, b: trendLine.slope }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onVehicleClick={(vehicle: any) => { setSelectedVehicle(vehicle); }} 
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- NOUVEAU : TOP 5 DES ALTERNATIVES --- */}
        {top5Deals.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Les 5 Meilleures Alternatives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {top5Deals.map((deal, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200 group">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img 
                      src={deal.image || "/placeholder.svg"} 
                      alt={deal.titre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-slate-900 hover:bg-white font-bold shadow-sm">
                        #{idx + 1}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-slate-900 truncate mb-1">{deal.titre}</h3>
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-2xl font-bold text-primary">{deal.prix.toLocaleString()} €</p>
                        <p className="text-xs text-slate-500">{deal.kilometrage.toLocaleString()} km • {deal.annee}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                          {Math.round(100 - (deal.prix / report.prix_moyen * 100))}% sous la cote
                        </Badge>
                      </div>
                    </div>
                    {/* --- CORRECTION 2 : .lien au lieu de .lien_url --- */}
                    <Button 
                      variant="default" 
                      className="w-full bg-slate-900 hover:bg-slate-800"
                      onClick={() => window.open(deal.lien, '_blank')}
                    >
                      Voir l'annonce
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {/* Carte "Voir plus" */}
              <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => navigate('/auth')}>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900">Voir les 50 autres annonces</h3>
                <p className="text-sm text-slate-500 text-center mt-1">Accédez à l'espace complet pour filtrer tout le marché.</p>
              </Card>
            </div>
          </div>
        )}

        {/* --- AVIS EXPERT & NÉGO --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Ce modèle reste une valeur sûre. Le véhicule analysé est particulièrement intéressant car il se situe dans la fourchette basse du marché tout en affichant un kilométrage cohérent."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">JD</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Julien D.</p>
                    <p className="text-xs text-slate-500">Analyste Automobile Senior</p>
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
                    <p className="text-sm text-slate-700"><strong>Entretien :</strong> Vérifiez si la grosse révision a été faite récemment.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm text-slate-700"><strong>Consommables :</strong> Négociez 400€ si les pneus sont à plus de 50% d'usure.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                    <p className="text-sm text-slate-700"><strong>Marché :</strong> Montrez au vendeur que 5 véhicules similaires sont vendus moins cher (voir Top 5).</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default DemoReportPage;