import { useState, useMemo, useCallback } from 'react';
import { VehicleWithScore, parseCSVFile, calculateDealScores } from '@/lib/csvParser';
import { SniperChart } from './SniperChart';
import { SniperKPIs } from './SniperKPIs';
import { OpportunityModal } from './OpportunityModal';
import { CSVUploader } from './CSVUploader';
import { MarketReportGenerator } from './MarketReportGenerator';
import { ClientOpportunityCard } from './ClientOpportunityCard';
import { Loader2, Crosshair, RotateCcw, Maximize2, Minimize2, Users, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Filter outliers using IQR method
function filterOutliers(data: VehicleWithScore[]): VehicleWithScore[] {
  if (data.length < 4) return data;

  // Calculate quartiles for price
  const prices = data.map(v => v.prix).sort((a, b) => a - b);
  const kms = data.map(v => v.kilometrage).sort((a, b) => a - b);

  const q1Price = prices[Math.floor(prices.length * 0.25)];
  const q3Price = prices[Math.floor(prices.length * 0.75)];
  const iqrPrice = q3Price - q1Price;

  const q1Km = kms[Math.floor(kms.length * 0.25)];
  const q3Km = kms[Math.floor(kms.length * 0.75)];
  const iqrKm = q3Km - q1Km;

  // Filter out values beyond 1.5 * IQR from quartiles
  const lowerPriceBound = q1Price - 1.5 * iqrPrice;
  const upperPriceBound = q3Price + 1.5 * iqrPrice;
  const lowerKmBound = q1Km - 1.5 * iqrKm;
  const upperKmBound = q3Km + 1.5 * iqrKm;

  return data.filter(v => 
    v.prix >= lowerPriceBound && 
    v.prix <= upperPriceBound &&
    v.kilometrage >= lowerKmBound &&
    v.kilometrage <= upperKmBound
  );
}

// Linear regression calculation
function calculateTrendLine(data: VehicleWithScore[]): { slope: number; intercept: number } {
  if (data.length < 2) return { slope: 0, intercept: 0 };

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const v of data) {
    sumX += v.kilometrage;
    sumY += v.prix;
    sumXY += v.kilometrage * v.prix;
    sumX2 += v.kilometrage * v.kilometrage;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function TradingDashboard() {
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [chartHeight, setChartHeight] = useState(500);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [kmRange, setKmRange] = useState<[number, number]>([0, 300000]);
  // Handle CSV upload - simple replace mode for Sniper
  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const parsed = await parseCSVFile(file);
      const scored = calculateDealScores(parsed);
      setVehicles(scored);
      console.log(`Mode Sniper: ${scored.length} véhicules chargés`);
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter outliers and calculate trend line
  const filteredVehicles = useMemo(() => filterOutliers(vehicles), [vehicles]);
  const trendLine = useMemo(() => calculateTrendLine(filteredVehicles), [filteredVehicles]);
  const outliersCount = vehicles.length - filteredVehicles.length;

  // Compute min/max for filter ranges
  const { maxPrice, maxKm } = useMemo(() => {
    if (filteredVehicles.length === 0) return { maxPrice: 100000, maxKm: 300000 };
    const prices = filteredVehicles.map(v => v.prix);
    const kms = filteredVehicles.map(v => v.kilometrage);
    return {
      maxPrice: Math.ceil(Math.max(...prices) / 1000) * 1000,
      maxKm: Math.ceil(Math.max(...kms) / 10000) * 10000,
    };
  }, [filteredVehicles]);

  // Apply user filters to vehicles for chart
  const chartVehicles = useMemo(() => {
    return filteredVehicles.filter(v => 
      v.prix >= priceRange[0] && v.prix <= priceRange[1] &&
      v.kilometrage >= kmRange[0] && v.kilometrage <= kmRange[1]
    );
  }, [filteredVehicles, priceRange, kmRange]);

  // Calculate KPIs based on filtered data
  const kpis = useMemo(() => {
    if (chartVehicles.length === 0) {
      return { avgPrice: 0, decotePer10k: 0, bestOffer: null, opportunitiesCount: 0 };
    }

    const avgPrice = chartVehicles.reduce((sum, v) => sum + v.prix, 0) / chartVehicles.length;
    
    // Décote per 10 000 km (slope * 10000)
    const decotePer10k = Math.abs(trendLine.slope * 10000);

    // Find opportunities (below trend line)
    const opportunities = chartVehicles.filter(v => {
      const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
      return v.prix < expectedPrice;
    });

    // Best offer = lowest price below trend with highest savings
    const bestOffer = opportunities.length > 0
      ? opportunities.reduce((best, v) => {
          const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
          const savings = expectedPrice - v.prix;
          const bestSavings = trendLine.slope * best.kilometrage + trendLine.intercept - best.prix;
          return savings > bestSavings ? v : best;
        })
      : null;

    return {
      avgPrice: Math.round(avgPrice),
      decotePer10k: Math.round(decotePer10k),
      bestOffer,
      opportunitiesCount: opportunities.length,
    };
  }, [chartVehicles, trendLine]);

  // Top 5 opportunities for client view (most below trend line)
  const top5Opportunities = useMemo(() => {
    return filteredVehicles
      .map(v => {
        const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
        const deviation = expectedPrice - v.prix;
        const deviationPercent = Math.round((deviation / expectedPrice) * 100);
        return {
          ...v,
          expectedPrice: Math.round(expectedPrice),
          deviation: Math.round(deviation),
          deviationPercent,
        };
      })
      .filter(v => v.deviationPercent >= 10) // At least 10% below trend
      .sort((a, b) => b.deviationPercent - a.deviationPercent)
      .slice(0, 5);
  }, [filteredVehicles, trendLine]);

  // Handle vehicle click from chart
  const handleVehicleClick = useCallback((vehicle: VehicleWithScore) => {
    // Add expected price info for the modal
    const expectedPrice = trendLine.slope * vehicle.kilometrage + trendLine.intercept;
    setSelectedVehicle({
      ...vehicle,
      expectedPrice: Math.round(expectedPrice),
      deviation: Math.round(expectedPrice - vehicle.prix),
      deviationPercent: Math.round(((expectedPrice - vehicle.prix) / expectedPrice) * 100),
    } as any);
  }, [trendLine]);

  // Clear data
  const handleClear = useCallback(() => {
    setVehicles([]);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  // No data state - full screen upload
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-success-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mode Sniper</h1>
              <p className="text-xs text-muted-foreground">Analyse Mono-Modèle</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Crosshair className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Importez votre fichier</h2>
              <p className="text-muted-foreground">
                Chargez un CSV contenant un seul modèle (ex: 500 Audi RS3) pour une analyse précise du marché.
              </p>
            </div>
            <CSVUploader onFileUpload={handleFileUpload} />
          </div>
        </div>
      </div>
    );
  }

  // Main Sniper view - Chart is king (70%)
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Mode Sniper</h1>
            <p className="text-xs text-muted-foreground">
              {filteredVehicles.length} véhicules analysés
              {outliersCount > 0 && <span className="text-warning"> ({outliersCount} aberrants exclus)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MarketReportGenerator 
            vehicles={filteredVehicles} 
            trendLine={trendLine} 
            kpis={kpis} 
          />
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
            Nouveau scan
          </Button>
          <CSVUploader onFileUpload={handleFileUpload} compact />
        </div>
      </header>

      {/* KPIs Bar */}
      <SniperKPIs
        avgPrice={kpis.avgPrice}
        decotePer10k={kpis.decotePer10k}
        bestOffer={kpis.bestOffer}
        totalVehicles={chartVehicles.length}
        opportunitiesCount={kpis.opportunitiesCount}
      />

      {/* Main content area */}
      <div className="flex-1 p-4 min-h-0 overflow-auto space-y-4">
        {/* Collapsible Chart Section */}
        <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
          <div className="rounded-xl border border-border bg-card">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-semibold text-foreground">Graphique Sniper (Analyse Expert)</h3>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur un point vert pour voir l'opportunité
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-muted-foreground">Opportunité</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive/50" />
                      <span className="text-muted-foreground">Au-dessus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-destructive" />
                      <span className="text-muted-foreground">Tendance</span>
                    </div>
                  </div>
                  {isChartOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                {/* Filters */}
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filtres
                      {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-6 mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                      {/* Price Filter */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Prix : {priceRange[0].toLocaleString('fr-FR')} € - {priceRange[1].toLocaleString('fr-FR')} €
                        </Label>
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          min={0}
                          max={maxPrice}
                          step={1000}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Km Filter */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Kilométrage : {kmRange[0].toLocaleString('fr-FR')} km - {kmRange[1].toLocaleString('fr-FR')} km
                        </Label>
                        <Slider
                          value={kmRange}
                          onValueChange={(value) => setKmRange(value as [number, number])}
                          min={0}
                          max={maxKm}
                          step={5000}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Height control */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <Minimize2 className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[chartHeight]}
                    onValueChange={(value) => setChartHeight(value[0])}
                    min={300}
                    max={900}
                    step={50}
                    className="flex-1"
                  />
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-14 text-right">{chartHeight}px</span>
                </div>
                
                <div style={{ height: chartHeight }}>
                  <SniperChart
                    data={chartVehicles}
                    onVehicleClick={handleVehicleClick}
                    trendLine={trendLine}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* CLIENT VIEW - Top 5 Opportunities */}
        <div className="rounded-xl border border-gold/30 bg-card overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gold/10 to-transparent border-b border-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">TOP OPPORTUNITÉS (VUE CLIENT)</h2>
                <p className="text-sm text-muted-foreground">Les meilleures affaires sélectionnées pour vous</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {top5Opportunities.length > 0 ? (
              <div className="grid gap-4">
                {top5Opportunities.map((vehicle, index) => (
                  <ClientOpportunityCard
                    key={vehicle.id || `${vehicle.marque}-${vehicle.modele}-${index}`}
                    vehicle={vehicle}
                    rank={index + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune opportunité exceptionnelle détectée</p>
                <p className="text-sm">Les véhicules doivent être au moins 10% sous le marché</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Opportunity Modal */}
      {selectedVehicle && (
        <OpportunityModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
