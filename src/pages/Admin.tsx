import { useState, useCallback, useRef, useMemo } from 'react';
import { VehicleWithScore } from '@/lib/csvParser';
import { SniperChart } from '@/components/trading/SniperChart';
import { SniperKPIs } from '@/components/trading/SniperKPIs';
import { SavingsSimulator } from '@/components/trading/SavingsSimulator';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { CSVImportModal } from '@/components/trading/CSVImportModal';
import { MarketReportGenerator } from '@/components/trading/MarketReportGenerator';
import { DealCard } from '@/components/trading/DealCard';
import { useVehicleData } from '@/contexts/VehicleDataContext';
import { 
  Loader2, Crosshair, RotateCcw, Maximize2, Minimize2, 
  ChevronDown, ChevronUp, SlidersHorizontal, Upload, Shield, ScanSearch 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Admin() {
  const {
    vehicles,
    filteredVehicles,
    chartVehicles,
    trendLine,
    outliersCount,
    filters,
    dataRanges,
    isLoading,
    loadingProgress,
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

  // --- 1. ÉCRAN DE CHARGEMENT ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="relative mb-12">
          <BrainCircuit className="w-28 h-28 text-indigo-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-black mb-6 tracking-tight text-center">Analyse du marché en cours...</h2>
        <div className="w-80 bg-slate-800 rounded-full h-2.5 overflow-hidden mb-4 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-indigo-400 font-bold text-lg">{loadingProgress}%</p>
      </div>
    );
  }

  // --- 2. ÉCRAN VIDE (IMPORT CSV) ---
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans">
        <header className="bg-slate-900 px-6 py-4 flex items-center gap-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Tour de Contrôle Admin</h1>
            <p className="text-xs text-slate-400 font-medium">Système d'analyse prédictive</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-10 md:p-14 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center max-w-lg w-full">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Crosshair className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Initialiser le Radar</h2>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
              Chargez un dataset CSV (Leboncoin / La Centrale) pour lancer le calcul des cotes et traquer les anomalies du marché.
            </p>
            <Button onClick={() => setIsImportModalOpen(true)} className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-600/20 gap-3 transition-all active:scale-95">
              <Upload className="w-6 h-6" />
              Importer un fichier CSV
            </Button>
          </div>
        </div>
        <CSVImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImport} />
      </div>
    );
  }

  // --- 3. DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans">
      
      {/* Admin Header Premium */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-5 flex flex-col lg:flex-row lg:items-center gap-5 justify-between shrink-0 z-10 relative shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-white flex flex-wrap items-center gap-3">
              Radar de Marché
              {vehicleInfo && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-300 text-sm font-bold whitespace-nowrap">
                  {vehicleInfo.marque} {vehicleInfo.modele}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              {filteredVehicles.length} véhicules analysés
              {outliersCount > 0 && <span className="text-rose-400 ml-2">({outliersCount} aberrants exclus)</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <MarketReportGenerator vehicles={filteredVehicles} trendLine={trendLine} kpis={kpis} />
          <Button variant="ghost" size="sm" onClick={clearData} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl h-10 px-4 font-bold transition-colors">
            <RotateCcw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouveau scan</span>
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 font-bold shadow-lg shadow-indigo-500/20 border-0">
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouveau CSV</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-auto space-y-8 max-w-7xl mx-auto w-full">
        
        {/* KPIs Bar */}
        <SniperKPIs
          avgPrice={kpis.avgPrice}
          decotePer10k={kpis.decotePer10k}
          bestOffer={kpis.bestOffer}
          totalVehicles={chartVehicles.length}
          opportunitiesCount={kpis.opportunitiesCount}
        />

        {/* Chart Section (Premium Dark Panel) */}
        <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Crosshair className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Graphique de Dispersion</h3>
                    <p className="text-sm text-slate-400">
                      Visualisation algorithmique de la décote kilométrique
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" /><span className="text-slate-300">Sous-coté</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/50" /><span className="text-slate-300">Surcoté</span></div>
                    <div className="flex items-center gap-2"><div className="w-8 h-1 bg-indigo-500 rounded-full" /><span className="text-slate-300">Vraie Cote</span></div>
                  </div>
                  {isChartOpen ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
                  <Minimize2 className="w-5 h-5 text-slate-400" />
                  <Slider
                    value={[chartHeight]}
                    onValueChange={(value) => setChartHeight(value[0])}
                    min={300}
                    max={900}
                    step={50}
                    className="flex-1"
                  />
                  <Maximize2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-300 w-16 text-right">{chartHeight} px</span>
                </div>
                
                <div style={{ height: chartHeight }} className="bg-slate-900 rounded-xl">
                  <SniperChart
                    data={chartVehicles}
                    onVehicleClick={handleVehicleClick}
                    trendLine={{ type: 'linear', a: trendLine.intercept, b: trendLine.slope }}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Filters Panel (Clean Card) */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Affinage des Données</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {chartVehicles.length} / {filteredVehicles.length} véhicules affichés
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-3 text-sm font-bold">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      {filters.minPrice.toLocaleString('fr-FR')} - {filters.maxPrice.toLocaleString('fr-FR')} €
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      {filters.minKm.toLocaleString('fr-FR')} - {filters.maxKm.toLocaleString('fr-FR')} km
                    </span>
                  </div>
                  {isFiltersOpen ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-8 pb-8 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Price Filter */}
                  <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" /> Filtre de Prix (€)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">Min</Label>
                        <Input type="number" value={filters.minPrice} onChange={(e) => setFilters({ minPrice: Number(e.target.value) || 0 })} className="mt-2 bg-white font-bold" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">Max</Label>
                        <Input type="number" value={filters.maxPrice} onChange={(e) => setFilters({ maxPrice: Number(e.target.value) || dataRanges.maxPrice })} className="mt-2 bg-white font-bold" />
                      </div>
                    </div>
                    <Slider value={[filters.minPrice, filters.maxPrice]} onValueChange={(value) => setFilters({ minPrice: value[0], maxPrice: value[1] })} min={0} max={dataRanges.maxPrice} step={1000} className="w-full pt-2" />
                  </div>
                  
                  {/* Km Filter */}
                  <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" /> Filtre Kilométrique (km)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">Min</Label>
                        <Input type="number" value={filters.minKm} onChange={(e) => setFilters({ minKm: Number(e.target.value) || 0 })} className="mt-2 bg-white font-bold" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">Max</Label>
                        <Input type="number" value={filters.maxKm} onChange={(e) => setFilters({ maxKm: Number(e.target.value) || dataRanges.maxKm })} className="mt-2 bg-white font-bold" />
                      </div>
                    </div>
                    <Slider value={[filters.minKm, filters.maxKm]} onValueChange={(value) => setFilters({ minKm: value[0], maxKm: value[1] })} min={0} max={dataRanges.maxKm} step={5000} className="w-full pt-2" />
                  </div>
                </div>
                
                <div className="flex justify-end mt-8">
                  <Button variant="outline" onClick={resetFilters} className="font-bold border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl">
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Savings Simulator */}
        <SavingsSimulator vehicles={chartVehicles} onScrollToDeals={handleScrollToDeals} />

        {/* Full Access Deal Cards */}
        <div ref={dealsRef} className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <Crosshair className="w-8 h-8 text-emerald-500" /> 
              Top 10 Opportunités
            </h2>
            <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-full border border-indigo-200">
              Admin Access
            </span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            {allDeals.map((vehicle, index) => (
              <DealCard key={vehicle.id || index} vehicle={vehicle} rank={index + 1} />
            ))}
          </div>
          
          {allDeals.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune pépite détectée</h3>
              <p className="text-slate-500">Modifiez les filtres ou importez un nouveau fichier CSV.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {selectedVehicle && (
        <OpportunityModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}

      <CSVImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImport} />
    </div>
  );
}
