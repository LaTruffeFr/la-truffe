import { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { VehicleWithScore } from '@/lib/csvParser';
import { useVehicleData } from '@/contexts/VehicleDataContext';

// Composants
import { SniperChart } from '@/components/trading/SniperChart';
import { ClientOpportunityCard } from '@/components/trading/ClientOpportunityCard';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { CSVImportModal } from '@/components/trading/CSVImportModal';
import { ClientOrdersPanel } from '@/components/admin/ClientOrdersPanel';
import { PublishReportModal } from '@/components/admin/PublishReportModal';

// UI & Icônes
import { 
  Loader2, Crosshair, RotateCcw, Upload, SlidersHorizontal, 
  BarChart3, ShoppingBag, User, Settings, LogOut, Send,
  CheckCircle2, AlertTriangle, Gauge, Fuel, Euro, ShieldCheck, Calendar, ArrowUpRight, Search, Share2
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

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const {
    vehicles,
    filteredVehicles,
    chartVehicles,
    trendLine,
    filters,
    dataRanges,
    isLoading,
    vehicleInfo,
    setFilters,
    uploadCSV,
    clearData,
    kpis,
  } = useVehicleData();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');

  const handleImport = useCallback((file: File, marque: string, modele: string) => {
    uploadCSV(file, marque, modele);
  }, [uploadCSV]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // --- CALCULS (Mode Client) ---
  const bestDeal = useMemo(() => {
    if (chartVehicles.length === 0) return null;
    return [...chartVehicles].sort((a, b) => b.dealScore - a.dealScore)[0];
  }, [chartVehicles]);

  const stats = useMemo(() => {
    const prixMarche = kpis.avgPrice;
    const prixCible = bestDeal ? bestDeal.prix : prixMarche;
    const economy = prixMarche - prixCible;
    const percentEconomy = prixMarche > 0 ? Math.round((economy / prixMarche) * 100) : 0;
    const score = bestDeal ? bestDeal.dealScore : 50;
    
    return { 
      prixMarche, 
      prixCible, 
      economy, 
      percentEconomy, 
      score, 
      isGoodDeal: economy > 0, 
      totalVehicules: chartVehicles.length 
    };
  }, [kpis, bestDeal, chartVehicles]);

  const topOpportunities = useMemo(() => {
    return [...chartVehicles]
      .sort((a, b) => b.dealScore - a.dealScore)
      .slice(0, 5)
      .map(v => {
        const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
        const ecart = expectedPrice - v.prix;
        return {
          ...v,
          hasEnoughData: true,
          ecartEuros: ecart,
          expectedPrice: expectedPrice,
          deviation: ecart,
          deviationPercent: expectedPrice ? Math.round((ecart / expectedPrice) * 100) : 0,
          clusterId: '', segmentKey: '', clusterSize: 0, coteCluster: 0, isPremium: false, prixMedian: 0, prixMoyen: 0, prix_median_segment: 0, puissance: 0
        };
      });
  }, [chartVehicles, trendLine]);

  // Génération "Live" des textes
  const expertOpinionPreview = useMemo(() => {
    if (!vehicleInfo || !bestDeal) return "En attente de données...";
    const km = bestDeal.kilometrage;
    const annee = bestDeal.annee;
    
    let avis = `La ${vehicleInfo.marque} ${vehicleInfo.modele} (${annee}) est un modèle actif sur le marché avec ${stats.totalVehicules} annonces analysées. `;
    
    if (stats.isGoodDeal) {
      avis += `Le modèle analysé ici est particulièrement intéressant car il se situe dans la fourchette basse du marché (économie de ${Math.abs(stats.percentEconomy)}%) tout en affichant un kilométrage de ${safeNum(km)} km.\n\n`;
      avis += `C'est une opportunité à saisir rapidement, mais qui demande une vérification rigoureuse de l'historique administratif.`;
    } else {
      avis += `Ce véhicule est affiché légèrement au-dessus de la moyenne du marché (+${safeNum(Math.abs(stats.economy))}€). \n\n`;
      avis += `Pour justifier ce prix, l'état esthétique doit être irréprochable et le carnet d'entretien complet.`;
    }
    return avis;
  }, [vehicleInfo, bestDeal, stats]);

  const argumentsPreview = useMemo(() => {
    if (!bestDeal) return [];
    const args = [];
    const km = bestDeal.kilometrage;
    
    if (km > 100000) args.push({ titre: "Gros Entretien", desc: "Le véhicule dépasse les 100 000 km. Vérifiez si la distribution a été faite." });
    else args.push({ titre: "Pneus et Freins", desc: "Vérifiez l'usure des consommables (pneus, disques). Négociez si usure > 50%." });

    if (stats.isGoodDeal) args.push({ titre: "Prix Suspect ?", desc: `Prix attractif (-${Math.abs(stats.percentEconomy)}%). Vérifiez l'historique d'accident.` });
    else args.push({ titre: "Comparaison Marché", desc: `Le véhicule est plus cher que la cote (${safeNum(stats.prixMarche)}€). Demandez un alignement.` });

    if (stats.totalVehicules > 40) args.push({ titre: "Concurrence", desc: `Il y a ${stats.totalVehicules} modèles similaires. Faites jouer la concurrence.` });
    else args.push({ titre: "Modèle Rare", desc: "Offre rare, la marge de négociation sera faible." });

    return args;
  }, [bestDeal, stats]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* HEADER ADMIN */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-2xl tracking-tight text-slate-900">
            La Truffe <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full ml-2">Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                <User className="h-5 w-5 text-slate-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2"><Settings className="h-4 w-4" /> Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600"><LogOut className="h-4 w-4" /> Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 print:hidden">
          <TabsList className="h-14 bg-transparent gap-6">
            <TabsTrigger value="scanner" className="rounded-none h-full px-0 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <BarChart3 className="w-4 h-4 mr-2" /> Scanner & Analyse
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none h-full px-0 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <ShoppingBag className="w-4 h-4 mr-2" /> Commandes Clients
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="scanner" className="flex-1 m-0 p-6 max-w-7xl mx-auto w-full space-y-8">
          
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Crosshair className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Prêt à analyser le marché ?</h2>
              <Button onClick={() => setIsImportModalOpen(true)} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white mt-6">
                <Upload className="w-5 h-5 mr-2" /> Importer un CSV
              </Button>
            </div>
          ) : (
            <>
              {/* --- BARRE D'ACTIONS ADMIN (FIXE) --- */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-40 transition-all print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {vehicleInfo?.marque} {vehicleInfo?.modele}
                      <Badge variant="secondary" className="ml-2 text-xs">{filteredVehicles.length} annonces</Badge>
                    </h2>
                    <Separator orientation="vertical" className="h-8" />
                    <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className={isFiltersOpen ? "bg-slate-100" : ""}>
                      <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtres
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearData} className="text-slate-500 hover:text-red-600">
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" /> Nouveau CSV
                    </Button>
                    {/* BOUTON DE PUBLICATION */}
                    <Button onClick={() => setIsPublishModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100">
                      <Send className="w-4 h-4 mr-2" /> PUBLIER RAPPORT
                    </Button>
                  </div>
                </div>

                {isFiltersOpen && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                      <Label>Fourchette de Prix ({filters.minPrice}€ - {filters.maxPrice}€)</Label>
                      <Slider value={[filters.minPrice, filters.maxPrice]} onValueChange={(val) => setFilters({ minPrice: val[0], maxPrice: val[1] })} min={0} max={dataRanges.maxPrice} step={500} />
                    </div>
                    <div className="space-y-4">
                      <Label>Kilométrage ({filters.minKm}km - {filters.maxKm}km)</Label>
                      <Slider value={[filters.minKm, filters.maxKm]} onValueChange={(val) => setFilters({ minKm: val[0], maxKm: val[1] })} min={0} max={dataRanges.maxKm} step={1000} />
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================= */}
              {/* DÉBUT DU DESIGN "RAPPORT CLIENT" EXACT */}
              {/* ======================================================= */}

              {/* 1. EN-TÊTE VÉHICULE */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="w-full md:w-1/3">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3] group bg-slate-100">
                    <img 
                      src={bestDeal?.image || `https://source.unsplash.com/800x600/?car,${vehicleInfo?.marque}`}
                      alt="Véhicule cible"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/800x600/?car,${vehicleInfo?.marque}`; }}
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
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{vehicleInfo?.marque} {vehicleInfo?.modele}</h1>
                        <p className="text-slate-500 flex items-center gap-2 text-sm">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{bestDeal?.annee}</span>
                          • {bestDeal?.titre?.substring(0, 50) || `${vehicleInfo?.marque} ${vehicleInfo?.modele}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">
                          {safeNum(bestDeal?.prix || stats.prixMarche)} €
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
                          <p className="font-bold text-slate-900">{safeNum(bestDeal?.kilometrage)} km</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Fuel className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Carburant</p>
                          <p className="font-bold text-slate-900 capitalize">{bestDeal?.carburant || 'Essence'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Année</p>
                          <p className="font-bold text-slate-900">{bestDeal?.annee}</p>
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

                  <div className="mt-6 flex gap-3 opacity-50 pointer-events-none">
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-lg">
                      Voir l'annonce originale
                    </Button>
                    <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center border-slate-300">
                      <Share2 className="w-5 h-5 text-slate-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 2. VERDICT TRUFFE */}
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
                    <p className="text-slate-500 text-sm mt-1">
                      {stats.totalVehicules} véhicules analysés sur le marché.
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

              {/* 3. GRAPHIQUE SNIPER */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" /> Analyse du Marché
                </h2>
                <Card className="shadow-lg border-slate-200 overflow-hidden h-[500px]">
                  <CardContent className="p-4 h-full">
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
              <div className="mb-12">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-6 h-6 text-green-600" />
                  Top 5 Opportunités identifiées
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topOpportunities.map((vehicule, index) => (
                    <ClientOpportunityCard 
                      key={index} 
                      vehicle={vehicule as any} 
                      rank={index + 1} 
                      onAnalyze={() => setSelectedVehicle(vehicule as any)}
                    />
                  ))}
                </div>
              </div>

              {/* 5. AVIS EXPERT & ARGUMENTS (DESIGN EXACT) */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Section Avis Expert */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">L'avis de l'expert</h2>
                  <Card className="border-l-4 border-l-primary shadow-sm h-full">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div>
                        <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line text-justify italic">
                          "{expertOpinionPreview}"
                        </p>
                        <Badge variant="outline" className="mb-4 text-xs">
                          (Ce texte est une prévisualisation, vous pourrez le modifier avant l'envoi)
                        </Badge>
                      </div>
                      
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

                {/* Section Arguments */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Arguments de négociation</h2>
                  <Card className="shadow-sm h-full">
                    <CardContent className="p-6">
                      <ul className="space-y-6">
                        {argumentsPreview.map((arg, index) => (
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
                      <Button className="w-full mt-8 bg-slate-900 hover:bg-slate-800 opacity-50 pointer-events-none">
                        <Search className="w-4 h-4 mr-2" /> Demander un autre audit
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="flex-1 m-0 p-6 max-w-7xl mx-auto w-full">
          <ClientOrdersPanel />
        </TabsContent>
      </Tabs>

      {/* MODALES */}
      <CSVImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImport} />
      
      <PublishReportModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        vehicles={chartVehicles}
        trendLine={trendLine}
        kpis={kpis}
        vehicleInfo={vehicleInfo}
      />

      {selectedVehicle && (
        <OpportunityModal
          vehicle={selectedVehicle as any}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}