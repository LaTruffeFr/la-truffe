import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { VehicleWithScore } from '@/lib/csvParser';
import { SniperChart } from '@/components/trading/SniperChart';
import { SniperKPIs } from '@/components/trading/SniperKPIs';
import { SavingsSimulator } from '@/components/trading/SavingsSimulator';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { CSVImportModal } from '@/components/trading/CSVImportModal';
import { MarketReportGenerator } from '@/components/trading/MarketReportGenerator';
import { DealCard } from '@/components/trading/DealCard';
import { ClientOrdersPanel } from '@/components/admin/ClientOrdersPanel';
import { useVehicleData } from '@/contexts/VehicleDataContext';
import { Loader2, Crosshair, RotateCcw, Maximize2, Minimize2, ChevronDown, ChevronUp, SlidersHorizontal, Upload, Shield, LogOut, ShoppingBag, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const {
    vehicles,
    filteredVehicles,
    chartVehicles,
    trendLine,
    outliersCount,
    filters,
    dataRanges,
    isLoading,
    vehicleInfo,
    setFilters,
    resetFilters,
    uploadCSV,
    clearData,
    kpis,
  } = useVehicleData();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [chartHeight, setChartHeight] = useState(500);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const dealsRef = useRef<HTMLDivElement>(null);

  const handleScrollToDeals = useCallback(() => {
    dealsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleImport = useCallback((file: File, marque: string, modele: string) => {
    uploadCSV(file, marque, modele);
  }, [uploadCSV]);

  const handleVehicleClick = useCallback((vehicle: VehicleWithScore) => {
    const expectedPrice = trendLine.slope * vehicle.kilometrage + trendLine.intercept;
    setSelectedVehicle({
      ...vehicle,
      expectedPrice: Math.round(expectedPrice),
      deviation: Math.round(expectedPrice - vehicle.prix),
      deviationPercent: Math.round(((expectedPrice - vehicle.prix) / expectedPrice) * 100),
    } as any);
  }, [trendLine]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // All deals with full info for admin
  const allDeals = useMemo(() => {
    return [...chartVehicles]
      .filter(v => v.dealScore < 0)
      .sort((a, b) => a.dealScore - b.dealScore)
      .slice(0, 10)
      .map(v => {
        const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
        return {
          ...v,
          expectedPrice: Math.round(expectedPrice),
          deviation: Math.round(expectedPrice - v.prix),
          deviationPercent: Math.round(((expectedPrice - v.prix) / expectedPrice) * 100),
        };
      });
  }, [chartVehicles, trendLine]);

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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Admin Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-6">
          <TabsList className="h-12">
            <TabsTrigger value="scanner" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Commandes Clients
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="flex-1 overflow-hidden m-0">
          {vehicles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Crosshair className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Importez votre fichier</h2>
                  <p className="text-muted-foreground">
                    Chargez un CSV contenant un seul modèle pour une analyse précise du marché.
                  </p>
                </div>
                <Button onClick={() => setIsImportModalOpen(true)} size="lg" className="gap-2">
                  <Upload className="w-5 h-5" />
                  Importer un fichier CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {/* KPIs Bar */}
              <SniperKPIs
                avgPrice={kpis.avgPrice}
                decotePer10k={kpis.decotePer10k}
                bestOffer={kpis.bestOffer}
                totalVehicles={chartVehicles.length}
                opportunitiesCount={kpis.opportunitiesCount}
              />

              <div className="p-4 space-y-4">
                {/* Header with actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {vehicleInfo?.marque} {vehicleInfo?.modele}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredVehicles.length} véhicules analysés
                      {outliersCount > 0 && <span className="text-warning"> ({outliersCount} aberrants exclus)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MarketReportGenerator 
                      vehicles={filteredVehicles} 
                      trendLine={trendLine} 
                      kpis={kpis} 
                    />
                    <Button variant="ghost" size="sm" onClick={clearData} className="gap-2 text-muted-foreground">
                      <RotateCcw className="w-4 h-4" />
                      Nouveau scan
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="gap-2">
                      <Upload className="w-4 h-4" />
                      Nouveau CSV
                    </Button>
                  </div>
                </div>

                {/* Savings Simulator */}
                <SavingsSimulator 
                  vehicles={chartVehicles} 
                  onScrollToDeals={handleScrollToDeals} 
                />

                {/* Full Access Deal Cards */}
                <div ref={dealsRef} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">🎯 TOP 10 OPPORTUNITÉS</h2>
                    <span className="text-sm text-success font-medium">Liens actifs</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                    {allDeals.map((vehicle, index) => (
                      <DealCard
                        key={vehicle.id || index}
                        vehicle={vehicle}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                  {allDeals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune opportunité détectée dans ce dataset
                    </div>
                  )}
                </div>

                {/* Filters Panel */}
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <div className="rounded-xl border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <SlidersHorizontal className="w-5 h-5 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">Filtres</h3>
                            <p className="text-xs text-muted-foreground">
                              {chartVehicles.length} / {filteredVehicles.length} véhicules affichés
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-muted">
                              {filters.minPrice.toLocaleString('fr-FR')} - {filters.maxPrice.toLocaleString('fr-FR')} €
                            </span>
                            <span className="px-2 py-1 rounded bg-muted">
                              {filters.minKm.toLocaleString('fr-FR')} - {filters.maxKm.toLocaleString('fr-FR')} km
                            </span>
                          </div>
                          {isFiltersOpen ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-border pt-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Price Filter */}
                          <div className="space-y-4">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-primary" />
                              Prix (€)
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                  type="number"
                                  value={filters.minPrice}
                                  onChange={(e) => setFilters({ minPrice: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                  type="number"
                                  value={filters.maxPrice}
                                  onChange={(e) => setFilters({ maxPrice: Number(e.target.value) || dataRanges.maxPrice })}
                                  placeholder={dataRanges.maxPrice.toString()}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <Slider
                              value={[filters.minPrice, filters.maxPrice]}
                              onValueChange={(value) => setFilters({ minPrice: value[0], maxPrice: value[1] })}
                              min={0}
                              max={dataRanges.maxPrice}
                              step={1000}
                              className="w-full"
                            />
                          </div>
                          
                          {/* Km Filter */}
                          <div className="space-y-4">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-success" />
                              Kilométrage (km)
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                  type="number"
                                  value={filters.minKm}
                                  onChange={(e) => setFilters({ minKm: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                  type="number"
                                  value={filters.maxKm}
                                  onChange={(e) => setFilters({ maxKm: Number(e.target.value) || dataRanges.maxKm })}
                                  placeholder={dataRanges.maxKm.toString()}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <Slider
                              value={[filters.minKm, filters.maxKm]}
                              onValueChange={(value) => setFilters({ minKm: value[0], maxKm: value[1] })}
                              min={0}
                              max={dataRanges.maxKm}
                              step={5000}
                              className="w-full"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm" onClick={resetFilters}>
                            Réinitialiser les filtres
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Chart Section */}
                <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
                  <div className="rounded-xl border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div>
                          <h3 className="font-semibold text-foreground">Graphique Sniper</h3>
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
              </div>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 overflow-auto m-0 p-6">
          <ClientOrdersPanel />
        </TabsContent>
      </Tabs>

      {/* Opportunity Modal */}
      {selectedVehicle && (
        <OpportunityModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

      {/* Import Modal */}
      <CSVImportModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
        onImport={handleImport}
      />
    </div>
  );
}
