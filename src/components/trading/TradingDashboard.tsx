import { useState, useMemo, useCallback } from 'react';
import { VehicleWithScore, parseCSVFile, calculateDealScores, getTopOpportunities } from '@/lib/csvParser';
import { KPICards } from './KPICards';
import { FilterSidebar } from './FilterSidebar';
import { SniperChart } from './SniperChart';
import { DealGrid } from './DealGrid';
import { CSVUploader } from './CSVUploader';
import { ClientSheetModal } from './ClientSheetModal';
import { Loader2, TrendingUp } from 'lucide-react';

export interface FilterState {
  marques: string[];
  budgetMin: number;
  budgetMax: number;
  anneeMin: number;
  kmMax: number;
  dealScoreMin: number;
}

const defaultFilters: FilterState = {
  marques: [],
  budgetMin: 0,
  budgetMax: 500000,
  anneeMin: 2010,
  kmMax: 300000,
  dealScoreMin: 50,
};

export function TradingDashboard() {
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);
  const [showAllOnChart, setShowAllOnChart] = useState(false);

  // Handle CSV upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const parsed = await parseCSVFile(file);
      const scored = calculateDealScores(parsed);
      setVehicles(scored);
      console.log(`Loaded ${scored.length} vehicles`);
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unique brands for filter
  const uniqueBrands = useMemo(() => {
    const brands = new Set(vehicles.map(v => v.marque));
    return Array.from(brands).sort();
  }, [vehicles]);

  // Apply filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (filters.marques.length > 0 && !filters.marques.includes(v.marque)) return false;
      if (v.prix < filters.budgetMin || v.prix > filters.budgetMax) return false;
      if (v.annee < filters.anneeMin) return false;
      if (v.kilometrage > filters.kmMax) return false;
      if (v.dealScore < filters.dealScoreMin) return false;
      return true;
    });
  }, [vehicles, filters]);

  // Chart data: limit to 500 unless "show all" is enabled
  const chartData = useMemo(() => {
    if (showAllOnChart) return filteredVehicles;
    return getTopOpportunities(filteredVehicles, 500);
  }, [filteredVehicles, showAllOnChart]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const opportunities = filteredVehicles.filter(v => v.dealScore >= 70);
    const bestDeal = opportunities.sort((a, b) => b.dealScore - a.dealScore)[0];
    const avgDiscount = opportunities.length > 0
      ? opportunities.reduce((sum, v) => sum + Math.abs(v.ecartPourcent), 0) / opportunities.length
      : 0;

    return {
      totalAnalyzed: vehicles.length,
      filteredCount: filteredVehicles.length,
      opportunitiesCount: opportunities.length,
      bestDeal,
      avgDiscount: Math.round(avgDiscount * 10) / 10,
    };
  }, [vehicles, filteredVehicles]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">La Truffe</h1>
              <p className="text-xs text-muted-foreground">Client Edition</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <CSVUploader onFileUpload={handleFileUpload} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">La Truffe</h1>
            <p className="text-xs text-muted-foreground">Client Edition</p>
          </div>
        </div>
        <CSVUploader onFileUpload={handleFileUpload} compact />
      </header>

      {/* KPI Bar */}
      <KPICards kpis={kpis} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          brands={uniqueBrands}
          totalCount={vehicles.length}
          filteredCount={filteredVehicles.length}
        />

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chart */}
          <div className="h-[320px] p-4 border-b border-border">
            <SniperChart
              data={chartData}
              showAll={showAllOnChart}
              onToggleShowAll={() => setShowAllOnChart(!showAllOnChart)}
              totalCount={filteredVehicles.length}
            />
          </div>

          {/* Deal Grid */}
          <div className="flex-1 overflow-hidden">
            <DealGrid
              vehicles={filteredVehicles}
              onSelectVehicle={setSelectedVehicle}
            />
          </div>
        </main>
      </div>

      {/* Client Sheet Modal */}
      {selectedVehicle && (
        <ClientSheetModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
