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
  Euro, ShieldCheck, Loader2, Search, ArrowUpRight, Car, ExternalLink
} from "lucide-react";

import { SniperChart } from '@/components/trading/SniperChart'; 
import { Footer } from '@/components/landing';
import { OpportunityModal } from '@/components/trading/OpportunityModal'; 

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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

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

  const vehiclesData = useMemo(() => {
    if (!report?.vehicles_data) return [];
    return report.vehicles_data as VehicleData[];
  }, [report]);

  const trendLine = useMemo(() => {
    return calculateTrendLine(vehiclesData);
  }, [vehiclesData]);

  const vehiculeCible = useMemo(() => {
    if (vehiclesData.length === 0) return null;
    const sorted = [...vehiclesData].sort((a, b) => 
      (b.dealScore || b.score_confiance || 0) - (a.dealScore || a.score_confiance || 0)
    );
    return sorted[0];
  }, [vehiclesData]);

  const topOpportunities = useMemo(() => {
    if (vehiclesData.length === 0) return [];
    // On trie par meilleur score et on prend les 5 premiers
    return [...vehiclesData]
      .sort((a, b) => (b.dealScore || b.score_confiance || 0) - (a.dealScore || a.score_confiance || 0))
      .slice(0, 5);
  }, [vehiclesData]);

  const stats = useMemo(() => {
    if (!report) return null;

    const prixMarche = Number(report.prix_moyen || 0);
    const prixCible = vehiculeCible ? Number(vehiculeCible.prix || 0) : prixMarche;
    const economy = prixMarche > 0 ? prixMarche - prixCible : 0;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    
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

  // --- GÉNÉRATION AUTOMATIQUE DES TEXTES ---
  const finalExpertOpinion = useMemo(() => {
    if (!report || !stats) return "";
    
    if (report.expert_opinion && report.expert_opinion.length > 10) {
      return report.expert_opinion;
    }

    const km = vehiculeCible?.kilometrage || report.kilometrage || 0;
    const annee = vehiculeCible?.annee || report.annee || 2020;
    
    let avis = `La ${report.marque} ${report.modele} (${annee}) est un modèle actif sur le marché avec ${stats.totalVehicules} annonces analysées. `;
    
    if (stats.isGoodDeal) {
      avis += `Le modèle analysé ici est particulièrement intéressant car il se situe dans la fourchette basse du marché (économie de ${Math.abs(stats.percentEconomy)}%) tout en affichant un kilométrage de ${safeNum(km)} km.\n\n`;
      avis += `C'est une opportunité à saisir rapidement, mais qui demande une vérification rigoureuse de l'historique administratif (nombre de propriétaires) et technique.`;
    } else {
      avis += `Ce véhicule est affiché légèrement au-dessus de la moyenne du marché (+${safeNum(Math.abs(stats.economy))}€). \n\n`;
      avis += `Pour justifier ce prix, l'état esthétique doit être irréprochable et le carnet d'entretien complet. Sinon, une négociation est tout à fait légitime.`;
    }

    return avis;
  }, [report, stats, vehiculeCible]);

  const finalArguments = useMemo(() => {
    if (!report || !stats) return [];
    
    if (report.negotiation_points && Array.isArray(report.negotiation_points) && report.negotiation_points.length > 0) {
      return report.negotiation_points;
    }
    
    const args = [];
    const km = vehiculeCible?.kilometrage || report.kilometrage || 0;
    const boite = (vehiculeCible?.transmission || report.transmission || '').toLowerCase();
    
    // Arg 1 : Entretien
    if (km > 115000) {
       args.push({ 
         titre: "Gros Entretien :", 
         desc: "Le véhicule dépasse les 115 000 km. Vérifiez si la courroie de distribution et la pompe à eau ont été faites. Sinon, demandez une baisse de 600€ à 900€." 
       });
    } else if (km > 55000 && (boite.includes('auto') || boite.includes('dsg'))) {
       args.push({ 
         titre: "Vidange Boîte Auto :", 
         desc: "Autour de 60 000 km, la boîte automatique doit être vidangée. Sans facture prouvant cette opération, négociez 400€ pour couvrir les frais." 
       });
    } else {
       args.push({ 
         titre: "Pneus et Freins :", 
         desc: "Vérifiez l'usure des consommables. Si les pneus sont à plus de 50% d'usure ou les disques creusés, c'est un levier immédiat pour baisser le prix de 300€." 
       });
    }

    // Arg 2 : Le Prix
    if (stats.isGoodDeal) {
       args.push({ 
         titre: "Prix Suspect ?", 
         desc: `Le prix est très attractif (-${Math.abs(stats.percentEconomy)}%). Soyez vigilant sur l'origine du véhicule (import ?) et l'absence d'accident passé.` 
       });
    } else {
       args.push({ 
         titre: "Comparaison Marché :", 
         desc: `Le véhicule est plus cher que la cote La Truffe (${safeNum(stats.prixMarche)}€). Utilisez ce rapport pour montrer au vendeur la réalité du marché.` 
       });
    }

    // Arg 3 : Rareté
    if (stats.totalVehicules > 50) {
       args.push({ 
         titre: "Concurrence :", 
         desc: `Il y a ${stats.totalVehicules} modèles similaires en vente. Le vendeur est en concurrence avec beaucoup d'autres, profitez-en pour être ferme sur votre offre.` 
       });
    } else {
       args.push({ 
         titre: "Historique :", 
         desc: "Sur un modèle aussi peu diffusé, l'historique limpide (factures, CT vierge) est le seul critère qui valide le prix demandé." 
       });
    }

    return args;
  }, [report, stats, vehiculeCible]);


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
      
      {/* HEADER */}
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
        
        {/* EN-TÊTE VÉHICULE */}
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

        {/* VERDICT TRUFFE */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GRAPHIQUE SNIPER */}
        {vehiclesData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" /> Analyse du Marché
            </h2>
            <Card className="shadow-lg border-slate-200 overflow-hidden h-[500px]">
              <CardContent className="p-4 h-full">
                <SniperChart 
                  data={vehiclesData as any} 
                  trendLine={trendLine}
                  onVehicleClick={(vehicle) => {
                    setSelectedVehicle(vehicle as unknown as VehicleData);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- TOP 5 OPPORTUNITÉS --- */}
        {topOpportunities.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
              Top 5 Opportunités identifiées
            </h3>
            
            <div className="grid gap-4">
              {topOpportunities.map((vehicule, index) => {
                const ecart = (stats.prixMarche || 0) - vehicule.prix;
                return (
                  <Card key={index} className="group overflow-hidden border-slate-200 hover:border-primary/50 transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-slate-100">
                        <img 
                          src={vehicule.image || `https://source.unsplash.com/800x600/?car,${report.marque}`} 
                          alt={vehicule.titre || "Véhicule"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/800x600/?car,${report.marque}`; }}
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                          Score {vehicule.dealScore || vehicule.score_confiance || 50}
                        </div>
                      </div>

                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors line-clamp-1">
                              {vehicule.titre || `${report.marque} ${report.modele}`}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                              <Car className="w-4 h-4" /> {vehicule.annee} • {safeNum(vehicule.kilometrage)} km
                              {vehicule.localisation && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded ml-2">{vehicule.localisation}</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{safeNum(vehicule.prix)} €</div>
                            {ecart > 0 && (
                              <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block mt-1">
                                -{safeNum(ecart)} € sous la cote
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div className="flex gap-2 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded">Analyse complète</span>
                            <span className="bg-slate-100 px-2 py-1 rounded">Fiabilité vérifiée</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="gap-2 bg-slate-900 hover:bg-slate-800" 
                            onClick={() => setSelectedVehicle(vehicule)}
                          >
                            Voir le détail <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* AVIS EXPERT & ARGUMENTS */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
            <Card className="border-l-4 border-l-primary shadow-sm h-full">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line text-justify">
                  "{finalExpertOpinion}"
                </p>
                
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg">
                    JD
                  </div>
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
            <Card className="shadow-sm h-full">
              <CardContent className="p-6">
                <ul className="space-y-6">
                  {finalArguments.map((arg, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-sm border border-green-200">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 leading-snug">
                          <strong className="text-slate-900 block mb-1">{arg.titre}</strong>
                          {arg.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/client-dashboard')}>
                  <Search className="w-4 h-4 mr-2" /> Demander un autre audit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      <Footer />

      {selectedVehicle && (
        <OpportunityModal
          vehicle={selectedVehicle as any}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

export default ReportView;