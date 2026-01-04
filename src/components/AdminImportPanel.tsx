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
  Search,
  MapPin,
  Car
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminImportPanelProps {
  onVehiclesImported: (vehicles: Vehicle[]) => void;
  existingVehicleLinks: Set<string>;
}

const CITIES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", 
  "Lille", "Nantes", "Strasbourg", "Nice", "Montpellier",
  "Rennes", "Grenoble", "Rouen", "Toulon", "Dijon"
];

const VEHICLE_TYPES = [
  { value: "voiture", label: "Voitures" },
  { value: "utilitaire", label: "Utilitaires" },
  { value: "moto", label: "Motos" },
  { value: "camping-car", label: "Camping-cars" },
];

export function AdminImportPanel({ onVehiclesImported, existingVehicleLinks }: AdminImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"csv" | "search">("csv");
  
  // CSV state
  const [csvText, setCsvText] = useState("");
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  
  // Search state
  const [searchCity, setSearchCity] = useState("Paris");
  const [searchType, setSearchType] = useState("voiture");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults([]);

    try {
      // Build search query for LeBonCoin via Google
      let query = `site:leboncoin.fr ${searchType} ${searchCity}`;
      
      if (searchKeywords.trim()) {
        query += ` ${searchKeywords}`;
      }
      
      if (maxPrice) {
        query += ` prix -${parseInt(maxPrice) + 1}`;
      }

      console.log("Searching:", query);

      const result = await firecrawlApi.search(query, {
        limit: 20,
        lang: 'fr',
        country: 'fr',
        tbs: 'qdr:d', // Last 24 hours
        scrapeOptions: {
          formats: ['markdown'],
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Échec de la recherche");
      }

      const results = result.data || [];
      setSearchResults(results);
      
      if (results.length > 0) {
        toast.success(`${results.length} annonces trouvées`);
      } else {
        toast.info("Aucune annonce trouvée");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const parseSearchResults = () => {
    // Convert search results to CSV format for parsing
    const csvLines: string[] = [];
    
    searchResults.forEach((result) => {
      const url = result.url || result.metadata?.sourceURL || '';
      const title = result.title || result.metadata?.title || '';
      const markdown = result.markdown || '';
      
      // Extract price from markdown or title
      const priceMatch = markdown.match(/(\d{1,3}(?:\s?\d{3})*)\s*€/) || 
                         title.match(/(\d{1,3}(?:\s?\d{3})*)\s*€/);
      const price = priceMatch ? priceMatch[1].replace(/\s/g, '') : '';
      
      // Extract year
      const yearMatch = markdown.match(/\b(19|20)\d{2}\b/) || title.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : '';
      
      // Extract km
      const kmMatch = markdown.match(/(\d{1,3}(?:\s?\d{3})*)\s*km/i);
      const km = kmMatch ? kmMatch[1].replace(/\s/g, '') : '';
      
      if (url && url.includes('leboncoin.fr') && price) {
        csvLines.push(`"${title}","${price}","${year}","${km}","${url}","","${searchCity}"`);
      }
    });

    if (csvLines.length === 0) {
      toast.error("Impossible d'extraire les données des résultats");
      return;
    }

    const header = "titre,prix,annee,kilometrage,lien,image,localisation";
    const csv = [header, ...csvLines].join('\n');
    setCsvText(csv);
    setActiveTab("csv");
    toast.success(`${csvLines.length} annonces prêtes à importer`);
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
            Recherchez sur LeBonCoin via Google ou importez un CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "csv" | "search")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Recherche LBC
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ville
                </Label>
                <Select value={searchCity} onValueChange={setSearchCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Type
                </Label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mots-clés (optionnel)</Label>
                <Input
                  placeholder="ex: Peugeot 308, diesel..."
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Prix max (optionnel)</Label>
                <Input
                  type="number"
                  placeholder="ex: 15000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Rechercher sur LeBonCoin
                </>
              )}
            </Button>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{searchResults.length} résultats trouvés</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={parseSearchResults}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Préparer l'import
                  </Button>
                </div>
                
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {searchResults.slice(0, 10).map((result, i) => (
                    <a
                      key={i}
                      href={result.url || result.metadata?.sourceURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-medium line-clamp-1">
                        {result.title || result.metadata?.title || 'Sans titre'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {result.url || result.metadata?.sourceURL}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Recherche via Google</p>
                  <p className="text-muted-foreground">
                    Cette méthode passe par Google pour trouver les annonces LBC, 
                    ce qui évite les blocages directs.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Données CSV (depuis Instant Data Scraper ou recherche)</Label>
              <Textarea
                placeholder="Collez ici les données CSV..."
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
