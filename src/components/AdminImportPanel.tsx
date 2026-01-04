import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { parseCSV, analyzeMarket } from "@/lib/vehicleAnalysis";
import { Vehicle } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Loader2, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminImportPanelProps {
  onVehiclesImported: (vehicles: Vehicle[]) => void;
  existingVehicleLinks: Set<string>;
}

export function AdminImportPanel({ onVehiclesImported, existingVehicleLinks }: AdminImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"csv" | "scrape">("csv");
  
  // CSV state
  const [csvText, setCsvText] = useState("");
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  
  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      toast.error("Veuillez coller des données CSV");
      return;
    }

    setIsProcessingCsv(true);
    
    try {
      const parsed = parseCSV(csvText);
      const analyzed = analyzeMarket(parsed);
      
      // Deduplicate
      const newVehicles = analyzed.filter(v => !existingVehicleLinks.has(v.lien || ''));
      
      if (newVehicles.length === 0) {
        toast.info("Aucun nouveau véhicule à ajouter");
        return;
      }

      // Save to database
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

      const { error } = await supabase.from('vehicles').insert(vehiclesToInsert);
      
      if (error) throw error;
      
      onVehiclesImported(newVehicles);
      setCsvText("");
      toast.success(`${newVehicles.length} véhicules importés avec succès`);
      setIsOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erreur lors de l'import");
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error("Veuillez entrer une URL");
      return;
    }

    setIsScraping(true);
    setScrapeResult(null);

    try {
      const result = await firecrawlApi.scrape(scrapeUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
      });

      if (!result.success) {
        throw new Error(result.error || "Échec du scraping");
      }

      const markdown = result.data?.markdown || result.markdown;
      
      if (markdown) {
        setScrapeResult(markdown);
        toast.success("Page scrapée avec succès");
      } else {
        toast.warning("Aucun contenu récupéré");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du scraping");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Import en masse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import de véhicules
          </DialogTitle>
          <DialogDescription>
            Importez des véhicules via CSV ou scraping automatique
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "csv" | "scrape")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </TabsTrigger>
            <TabsTrigger value="scrape" className="gap-2">
              <Globe className="w-4 h-4" />
              Scraping Web
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Données CSV (depuis Instant Data Scraper)</Label>
              <Textarea
                placeholder="Collez ici les données CSV exportées depuis Instant Data Scraper..."
                className="min-h-[200px] font-mono text-sm"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format attendu : Titre, Prix, Année, Kilométrage, Lien, Image...
              </p>
            </div>

            <Button 
              onClick={handleCsvImport} 
              disabled={isProcessingCsv || !csvText.trim()}
              className="w-full gap-2"
            >
              {isProcessingCsv ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importer les véhicules
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="scrape" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>URL à scraper</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.leboncoin.fr/recherche?..."
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                />
                <Button 
                  onClick={handleScrape} 
                  disabled={isScraping || !scrapeUrl.trim()}
                >
                  {isScraping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Note : LeBonCoin peut bloquer le scraping automatique. Utilisez Instant Data Scraper comme fallback.
              </p>
            </div>

            {scrapeResult && (
              <div className="space-y-2">
                <Label>Résultat du scraping</Label>
                <Textarea
                  value={scrapeResult}
                  readOnly
                  className="min-h-[200px] font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(scrapeResult);
                      toast.success("Copié dans le presse-papier");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Scraping automatique</p>
                  <p className="text-muted-foreground">
                    Pour un scraping fiable, utilise l'extension{" "}
                    <a 
                      href="https://chrome.google.com/webstore/detail/instant-data-scraper/ofaokhiedipichpaobibbnahnkdoiiah" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Instant Data Scraper
                    </a>
                    {" "}puis importe le CSV ici.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
