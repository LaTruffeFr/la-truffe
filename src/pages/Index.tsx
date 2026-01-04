import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { CSVUploader } from "@/components/CSVUploader";
import { SniperChartOptimized } from "@/components/SniperChartOptimized";
import { MarketList } from "@/components/MarketList";
import { EmptyState } from "@/components/EmptyState";
import { OpportunityBanner } from "@/components/OpportunityBanner";
import { QuickActions } from "@/components/QuickActions";
import { Vehicle, MarketStats } from "@/types/vehicle";
import { parseCSV, analyzeMarket, calculateStats } from "@/lib/vehicleAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LayoutGrid, Trash2, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Charger les véhicules sauvegardés au démarrage
  useEffect(() => {
    loadSavedVehicles();
  }, []);

  const loadSavedVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedVehicles: Vehicle[] = data.map(v => ({
          id: v.id,
          titre: v.titre,
          prix: v.prix,
          kilometrage: v.kilometrage,
          annee: v.annee || undefined,
          carburant: v.carburant as Vehicle['carburant'],
          transmission: v.transmission as Vehicle['transmission'],
          puissance: v.puissance || 0,
          lien: v.lien || undefined,
          image: v.image || undefined,
          localisation: v.localisation || undefined,
          marque: v.marque,
          modele: v.modele,
          prixAjuste: v.prix_ajuste ? Number(v.prix_ajuste) : undefined,
          gainPotentiel: v.gain_potentiel ? Number(v.gain_potentiel) : undefined,
          scoreConfiance: v.score_confiance ? Number(v.score_confiance) : undefined,
          prixMedianSegment: v.prix_median_segment ? Number(v.prix_median_segment) : undefined,
        }));
        setVehicles(loadedVehicles);
        toast.success(`${loadedVehicles.length} véhicules chargés`, {
          description: "Données récupérées avec succès",
        });
      }
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
      toast.error("Erreur de chargement", {
        description: "Impossible de récupérer les véhicules",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les nouveaux véhicules en base
  const saveVehiclesToDB = async (newVehicles: Vehicle[]) => {
    try {
      const vehiclesToInsert = newVehicles.map(v => ({
        titre: v.titre,
        prix: v.prix,
        kilometrage: v.kilometrage,
        annee: v.annee || null,
        carburant: v.carburant,
        transmission: v.transmission,
        puissance: v.puissance || 0,
        lien: v.lien || null,
        image: v.image || null,
        localisation: v.localisation || null,
        marque: v.marque,
        modele: v.modele,
        prix_ajuste: v.prixAjuste || null,
        gain_potentiel: v.gainPotentiel || null,
        score_confiance: v.scoreConfiance || null,
        prix_median_segment: v.prixMedianSegment || null,
      }));

      const { error } = await supabase
        .from('vehicles')
        .insert(vehiclesToInsert);

      if (error) throw error;
      toast.success(`${newVehicles.length} véhicules ajoutés`, {
        description: "Analyse de marché mise à jour",
      });
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const stats = useMemo<MarketStats>(() => {
    if (vehicles.length === 0) {
      return {
        totalVehicules: 0,
        opportunitesDetectees: 0,
        margeMoyenne: 0,
        budgetTotal: 0,
      };
    }
    return calculateStats(vehicles);
  }, [vehicles]);

  // Find best deal for banner
  const bestDeal = useMemo(() => {
    if (vehicles.length === 0) return null;
    return vehicles.reduce((best, current) => {
      const currentGain = current.gainPotentiel || 0;
      const bestGain = best?.gainPotentiel || 0;
      return currentGain > bestGain ? current : best;
    }, vehicles[0]);
  }, [vehicles]);

  const handleDataLoaded = useCallback((csvText: string) => {
    setIsProcessing(true);
    
    setTimeout(async () => {
      try {
        const parsed = parseCSV(csvText);
        const analyzed = analyzeMarket(parsed);
        
        // Deduplicate by lien (URL)
        const existingLinks = new Set(vehicles.map(v => v.lien));
        const newVehicles = analyzed.filter(v => !existingLinks.has(v.lien));
        
        if (newVehicles.length > 0) {
          setVehicles(prev => [...prev, ...newVehicles]);
          await saveVehiclesToDB(newVehicles);
        } else {
          toast.info("Aucun nouveau véhicule", {
            description: "Tous les véhicules existent déjà",
          });
        }
      } catch (error) {
        console.error("Error processing CSV:", error);
        toast.error("Erreur de traitement", {
          description: "Vérifiez le format de votre fichier CSV",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [vehicles]);

  const handleClearData = async () => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      
      setVehicles([]);
      toast.success("Données effacées", {
        description: "Prêt pour une nouvelle analyse",
      });
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadSavedVehicles();
  };

  const handleExport = () => {
    if (vehicles.length === 0) return;

    const headers = ['Titre', 'Marque', 'Modèle', 'Prix', 'Kilométrage', 'Année', 'Gain Potentiel', 'Lien'];
    const csvContent = [
      headers.join(','),
      ...vehicles.map(v => [
        `"${v.titre}"`,
        v.marque,
        v.modele,
        v.prix,
        v.kilometrage,
        v.annee || '',
        v.gainPotentiel || '',
        v.lien || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `la-truffe-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("Export réussi", {
      description: `${vehicles.length} véhicules exportés`,
    });
  };

  const hasData = vehicles.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-foreground font-medium">Chargement des données...</p>
            <p className="text-sm text-muted-foreground">Récupération de vos véhicules</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top Section: KPIs and Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <KPICards stats={stats} isLoading={isProcessing} />
            {hasData && <OpportunityBanner bestDeal={bestDeal} />}
          </div>
          <div className="space-y-4">
            <CSVUploader onDataLoaded={handleDataLoaded} isProcessing={isProcessing} />
            {hasData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Effacer toutes les données
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement tous les {vehicles.length} véhicules. 
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer tout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Main Content */}
        {hasData ? (
          <Tabs defaultValue="chart" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="chart" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sniper View</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Market List</span>
                </TabsTrigger>
              </TabsList>
              
              <QuickActions 
                vehicleCount={vehicles.length}
                onRefresh={handleRefresh}
                onExport={handleExport}
                isRefreshing={isLoading}
              />
            </div>

            <TabsContent value="chart" className="mt-0 animate-fade-in">
              <SniperChartOptimized vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="list" className="mt-0 animate-fade-in">
              <MarketList vehicles={vehicles} />
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          variant="gold"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg animate-fade-in gold-glow"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 La Truffe • Car Flipping Intelligence</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Système Opérationnel
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
