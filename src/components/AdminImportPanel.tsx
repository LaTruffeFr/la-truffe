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
      console.log("Parsing markdown:", markdown.substring(0, 500));
      
      // Extract title (usually first heading or first line)
      const titleMatch = markdown.match(/^#\s*(.+)/m) || markdown.match(/^(.+?)[\n\r]/);
      const titre = titleMatch ? titleMatch[1].trim() : 'Véhicule';

      // Extract price - look for €  patterns
      const priceMatch = markdown.match(/(\d{1,3}(?:[\s\u00a0.,]?\d{3})*)\s*€/);
      const prix = priceMatch ? parseInt(priceMatch[1].replace(/[\s\u00a0.,]/g, '')) : 0;

      // Extract year - prioritize 4-digit years in typical car year range
      const yearMatches = markdown.match(/\b(19[89]\d|20[0-2]\d)\b/g);
      const annee = yearMatches ? parseInt(yearMatches[0]) : null;

      // Extract km - various formats
      const kmMatch = markdown.match(/(\d{1,3}(?:[\s\u00a0.,]?\d{3})*)\s*km/i);
      const kilometrage = kmMatch ? parseInt(kmMatch[1].replace(/[\s\u00a0.,]/g, '')) : 0;

      // Extract power (CV / ch / chevaux)
      const puissanceMatch = markdown.match(/(\d{1,4})\s*(?:cv|ch|chevaux)/i);
      const puissance = puissanceMatch ? parseInt(puissanceMatch[1]) : undefined;

      // Extract fuel type - motorisation
      const carburantPatterns = [
        /\b(diesel)\b/i,
        /\b(essence)\b/i,
        /\b(électrique|electrique)\b/i,
        /\b(hybride(?:\s+rechargeable)?)\b/i,
        /\b(gpl)\b/i,
        /\b(phev)\b/i,
      ];
      let carburantRaw = 'autre';
      for (const pattern of carburantPatterns) {
        const match = markdown.match(pattern);
        if (match) {
          carburantRaw = match[1].toLowerCase();
          break;
        }
      }
      const carburantMap: Record<string, Carburant> = {
        'diesel': 'diesel', 
        'essence': 'essence', 
        'électrique': 'electrique', 
        'electrique': 'electrique', 
        'hybride': 'hybride',
        'hybride rechargeable': 'hybride',
        'phev': 'hybride',
        'gpl': 'gpl'
      };
      const carburant: Carburant = carburantMap[carburantRaw] || 'autre';

      // Extract transmission - boîte de vitesse
      const transmissionPatterns = [
        /\b(automatique|auto|bva|dsg|dct|tiptronic|s-tronic|edc|eat|at)\b/i,
        /\b(manuelle?|bvm|mt)\b/i,
        /boîte\s*(automatique|manuelle)/i,
      ];
      let transmission: Transmission = 'autre';
      for (const pattern of transmissionPatterns) {
        const match = markdown.match(pattern);
        if (match) {
          const val = match[1].toLowerCase();
          if (['automatique', 'auto', 'bva', 'dsg', 'dct', 'tiptronic', 's-tronic', 'edc', 'eat', 'at'].includes(val)) {
            transmission = 'automatique';
          } else if (['manuelle', 'manuel', 'bvm', 'mt'].includes(val)) {
            transmission = 'manuelle';
          }
          break;
        }
      }

      // Extended brand list
      const brands = [
        'alfa romeo', 'audi', 'bmw', 'citroen', 'citroën', 'cupra', 'dacia', 
        'ds', 'fiat', 'ford', 'honda', 'hyundai', 'jaguar', 'jeep', 'kia', 
        'land rover', 'lexus', 'mazda', 'mercedes', 'mercedes-benz', 'mini', 
        'mitsubishi', 'nissan', 'opel', 'peugeot', 'porsche', 'renault', 
        'seat', 'skoda', 'smart', 'subaru', 'suzuki', 'tesla', 'toyota', 
        'volkswagen', 'vw', 'volvo'
      ];
      
      const textLower = (titre + ' ' + markdown).toLowerCase();
      let marque = 'Autre';
      let foundBrandIndex = -1;
      
      for (const brand of brands) {
        const idx = textLower.indexOf(brand);
        if (idx !== -1 && (foundBrandIndex === -1 || idx < foundBrandIndex)) {
          marque = brand;
          foundBrandIndex = idx;
        }
      }
      
      // Normalize brand name
      const brandNormalize: Record<string, string> = {
        'vw': 'Volkswagen',
        'citroën': 'Citroen',
        'mercedes-benz': 'Mercedes',
      };
      marque = brandNormalize[marque] || marque.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Extract model - look after brand name in title
      let modele = 'Modèle';
      const titleLower = titre.toLowerCase();
      const brandInTitle = brands.find(b => titleLower.includes(b));
      if (brandInTitle) {
        const brandIdx = titleLower.indexOf(brandInTitle);
        const afterBrand = titre.substring(brandIdx + brandInTitle.length).trim();
        // Take first word(s) as model (handle things like "308 GT", "Golf 8")
        const modelMatch = afterBrand.match(/^([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)/);
        if (modelMatch) {
          modele = modelMatch[1].trim();
        }
      }

      // Extract location
      const locPatterns = [
        /(?:Localisation|Ville|Location)[:\s]*([A-Za-zÀ-ÿ\s-]+?)(?:\n|,|\(|$)/i,
        /\b(\d{5})\s+([A-Za-zÀ-ÿ\s-]+)/,
      ];
      let localisation: string | null = null;
      for (const pattern of locPatterns) {
        const match = markdown.match(pattern);
        if (match) {
          localisation = match[2] || match[1];
          break;
        }
      }

      console.log("Parsed vehicle:", { titre, prix, annee, kilometrage, puissance, carburant, transmission, marque, modele });

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
        marque,
        modele,
        lien: url,
        localisation,
        image: undefined,
        puissance,
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
