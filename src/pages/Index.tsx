import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { CSVUploader } from "@/components/CSVUploader";
import { SniperChartOptimized } from "@/components/SniperChartOptimized";
import { MarketList } from "@/components/MarketList";
import { EmptyState } from "@/components/EmptyState";
import { Vehicle, MarketStats } from "@/types/vehicle";
import { parseCSV, analyzeMarket, calculateStats } from "@/lib/vehicleAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LayoutGrid, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les véhicules sauvegardés au démarrage
  useEffect(() => {
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
          toast.success(`${loadedVehicles.length} véhicules chargés`);
        }
      } catch (error) {
        console.error("Erreur chargement véhicules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedVehicles();
  }, []);

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
      toast.success(`${newVehicles.length} véhicules sauvegardés`);
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
          toast.info("Aucun nouveau véhicule à ajouter");
        }
      } catch (error) {
        console.error("Error processing CSV:", error);
        toast.error("Erreur lors du traitement du CSV");
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
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      
      setVehicles([]);
      toast.success("Données effacées");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const hasData = vehicles.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des données...</p>
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
          <div className="lg:col-span-2">
            <KPICards stats={stats} isLoading={isProcessing} />
          </div>
          <div className="space-y-4">
            <CSVUploader onDataLoaded={handleDataLoaded} isProcessing={isProcessing} />
            {hasData && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearData}
                className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer toutes les données
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {hasData ? (
          <Tabs defaultValue="chart" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="chart" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Sniper View
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Market List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-0">
              <SniperChartOptimized vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <MarketList vehicles={vehicles} />
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 La Truffe • Car Flipping Intelligence</p>
            <div className="flex items-center gap-4">
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
