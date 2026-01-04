import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { parseCSV, analyzeMarket } from "@/lib/vehicleAnalysis";
import { Vehicle, Carburant, Transmission } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Loader2, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Link,
  Upload
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
  const [activeTab, setActiveTab] = useState<"url" | "csv">("url");
  
  // URL scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  
  // CSV state
  const [csvText, setCsvText] = useState("");
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  const handleUrlScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error("Veuillez coller un lien LeBonCoin");
      return;
    }

    if (!scrapeUrl.includes('leboncoin.fr')) {
      toast.error("Le lien doit provenir de LeBonCoin");
      return;
    }

    setIsScraping(true);

    try {
      console.log("Scraping URL:", scrapeUrl);
      
      const result = await firecrawlApi.scrape(scrapeUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      });

      if (!result.success) {
        throw new Error(result.error || "Échec du scraping");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;
      const markdown = Array.isArray(data) ? data[0]?.markdown : (data?.markdown || '');
      
      // Parse vehicle data from markdown
      const vehicle = parseVehicleFromMarkdown(markdown, scrapeUrl);
      
      if (!vehicle) {
        toast.error("Impossible d'extraire les données du véhicule");
        return;
      }

      // Check duplicate
      if (existingVehicleLinks.has(scrapeUrl)) {
        toast.info("Ce véhicule existe déjà");
        return;
      }

      // Analyze and save
      const analyzed = analyzeMarket([vehicle]);
      const vehicleToInsert = {
        titre: analyzed[0].titre,
        prix: analyzed[0].prix,
        kilometrage: analyzed[0].kilometrage,
        annee: analyzed[0].annee || null,
        carburant: analyzed[0].carburant,
        transmission: analyzed[0].transmission,
        puissance: analyzed[0].puissance || 0,
        lien: analyzed[0].lien || null,
        image: analyzed[0].image || null,
        localisation: analyzed[0].localisation || null,
        marque: analyzed[0].marque,
        modele: analyzed[0].modele,
        prix_ajuste: analyzed[0].prixAjuste || null,
        gain_potentiel: analyzed[0].gainPotentiel || null,
        score_confiance: analyzed[0].scoreConfiance || null,
        prix_median_segment: analyzed[0].prixMedianSegment || null,
      };

      const { error } = await supabase.from('vehicles').insert([vehicleToInsert]);
      
      if (error) throw error;
      
      onVehiclesImported(analyzed);
      setScrapeUrl("");
      toast.success("Véhicule importé avec succès !");
      setIsOpen(false);
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du scraping");
    } finally {
      setIsScraping(false);
    }
  };

  const parseVehicleFromMarkdown = (markdown: string, url: string): Vehicle | null => {
    try {
      // Extract title (usually first heading or first line)
      const titleMatch = markdown.match(/^#\s*(.+)/m) || markdown.match(/^(.+?)[\n\r]/);
      const titre = titleMatch ? titleMatch[1].trim() : 'Véhicule';

      // Extract price
      const priceMatch = markdown.match(/(\d{1,3}(?:[\s\u00a0]?\d{3})*)\s*€/);
      const prix = priceMatch ? parseInt(priceMatch[1].replace(/[\s\u00a0]/g, '')) : 0;

      // Extract year
      const yearMatch = markdown.match(/\b(19|20)\d{2}\b/);
      const annee = yearMatch ? parseInt(yearMatch[0]) : null;

      // Extract km
      const kmMatch = markdown.match(/(\d{1,3}(?:[\s\u00a0]?\d{3})*)\s*km/i);
      const kilometrage = kmMatch ? parseInt(kmMatch[1].replace(/[\s\u00a0]/g, '')) : 0;

      // Extract fuel type
      const carburantMatch = markdown.match(/\b(diesel|essence|électrique|electrique|hybride|gpl)\b/i);
      const carburantRaw = carburantMatch ? carburantMatch[1].toLowerCase() : 'autre';
      const carburantMap: Record<string, Carburant> = {
        'diesel': 'diesel', 'essence': 'essence', 'électrique': 'electrique', 
        'electrique': 'electrique', 'hybride': 'hybride', 'gpl': 'gpl'
      };
      const carburant: Carburant = carburantMap[carburantRaw] || 'autre';

      // Extract transmission
      const transmissionMatch = markdown.match(/\b(automatique|manuelle?)\b/i);
      const transmissionRaw = transmissionMatch ? transmissionMatch[1].toLowerCase() : 'autre';
      const transmission: Transmission = transmissionRaw.startsWith('auto') ? 'automatique' : 
        transmissionRaw.startsWith('man') ? 'manuelle' : 'autre';

      // Extract brand and model from title
      const brands = ['peugeot', 'renault', 'citroen', 'volkswagen', 'audi', 'bmw', 'mercedes', 'toyota', 'ford', 'opel', 'fiat', 'nissan', 'hyundai', 'kia', 'seat', 'skoda', 'dacia', 'mini', 'volvo', 'mazda', 'honda', 'suzuki', 'land rover', 'jeep', 'porsche', 'tesla'];
      const titleLower = titre.toLowerCase();
      const marque = brands.find(b => titleLower.includes(b)) || 'Autre';
      
      // Model is everything after brand
      const brandIndex = titleLower.indexOf(marque.toLowerCase());
      const modele = brandIndex >= 0 
        ? titre.substring(brandIndex + marque.length).trim().split(/[\s-]/)[0] || 'Modèle'
        : 'Modèle';

      // Extract location
      const locMatch = markdown.match(/(?:à|Location|Localisation)[:\s]*([A-Za-zÀ-ÿ\s-]+?)(?:\n|,|\()/i);
      const localisation = locMatch ? locMatch[1].trim() : null;

      if (prix === 0) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        titre,
        prix,
        annee,
        kilometrage,
        carburant,
        transmission,
        marque: marque.charAt(0).toUpperCase() + marque.slice(1),
        modele,
        lien: url,
        localisation,
        image: undefined,
        puissance: undefined,
        prixAjuste: undefined,
        gainPotentiel: undefined,
        scoreConfiance: undefined,
        prixMedianSegment: undefined,
      };
    } catch (e) {
      console.error("Parse error:", e);
      return null;
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Import en masse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import de véhicules
          </DialogTitle>
          <DialogDescription>
            Collez un lien LeBonCoin ou importez un CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "csv")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-2">
              <Link className="w-4 h-4" />
              Lien LBC
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Lien de l'annonce LeBonCoin</Label>
              <Input
                placeholder="https://www.leboncoin.fr/voitures/..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleUrlScrape} 
              disabled={isScraping || !scrapeUrl.trim()}
              className="w-full gap-2"
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraction en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importer ce véhicule
                </>
              )}
            </Button>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Import par lien</p>
                  <p className="text-muted-foreground">
                    Copiez le lien d'une annonce LeBonCoin et collez-le ici. 
                    Les données seront extraites automatiquement.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Fichier CSV (depuis Instant Data Scraper)</Label>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        setCsvText(text);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {csvText ? "Fichier chargé ✓" : "Glissez ou cliquez pour importer"}
                    </p>
                    <p className="text-muted-foreground">CSV ou Excel</p>
                  </div>
                </div>
              </div>

              {csvText && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    {csvText.split('\n').length - 1} lignes détectées
                  </p>
                </div>
              )}
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

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Import manuel</p>
                  <p className="text-muted-foreground">
                    Utilisez{" "}
                    <a 
                      href="https://chrome.google.com/webstore/detail/instant-data-scraper/ofaokhiedipichpaobibbnahnkdoiiah" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Instant Data Scraper
                    </a>
                    {" "}pour un scraping fiable.
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
