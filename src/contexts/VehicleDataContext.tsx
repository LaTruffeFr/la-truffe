import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { VehicleWithScore, parseCSVFile, calculateDealScores } from '@/lib/csvParser';

// Filter outliers using IQR method
function filterOutliers(data: VehicleWithScore[]): VehicleWithScore[] {
  if (data.length < 4) return data;

  const prices = data.map(v => v.prix).sort((a, b) => a - b);
  const kms = data.map(v => v.kilometrage).sort((a, b) => a - b);

  const q1Price = prices[Math.floor(prices.length * 0.25)];
  const q3Price = prices[Math.floor(prices.length * 0.75)];
  const iqrPrice = q3Price - q1Price;

  const q1Km = kms[Math.floor(kms.length * 0.25)];
  const q3Km = kms[Math.floor(kms.length * 0.75)];
  const iqrKm = q3Km - q1Km;

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

export interface Filters {
  minPrice: number;
  maxPrice: number;
  minKm: number;
  maxKm: number;
}

export interface VehicleInfo {
  marque: string;
  modele: string;
}

interface VehicleDataContextType {
  vehicles: VehicleWithScore[];
  filteredVehicles: VehicleWithScore[];
  chartVehicles: VehicleWithScore[];
  trendLine: { slope: number; intercept: number };
  outliersCount: number;
  filters: Filters;
  dataRanges: { minPrice: number; maxPrice: number; minKm: number; maxKm: number };
  isLoading: boolean;
  vehicleInfo: VehicleInfo | null;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  uploadCSV: (file: File, marque: string, modele: string) => Promise<void>;
  clearData: () => void;
  topOpportunities: Array<VehicleWithScore & { expectedPrice: number; deviation: number; deviationPercent: number }>;
  kpis: { avgPrice: number; decotePer10k: number; bestOffer: VehicleWithScore | null; opportunitiesCount: number };
}

const VehicleDataContext = createContext<VehicleDataContextType | null>(null);

export function VehicleDataProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [filters, setFiltersState] = useState<Filters>({
    minPrice: 0,
    maxPrice: 999999,
    minKm: 0,
    maxKm: 999999,
  });

  // Filter outliers and calculate trend line
  const filteredVehicles = useMemo(() => filterOutliers(vehicles), [vehicles]);
  const trendLine = useMemo(() => calculateTrendLine(filteredVehicles), [filteredVehicles]);
  const outliersCount = vehicles.length - filteredVehicles.length;

  // Compute actual data ranges
  const dataRanges = useMemo(() => {
    if (filteredVehicles.length === 0) {
      return { minPrice: 0, maxPrice: 100000, minKm: 0, maxKm: 300000 };
    }
    const prices = filteredVehicles.map(v => v.prix);
    const kms = filteredVehicles.map(v => v.kilometrage);
    return {
      minPrice: Math.floor(Math.min(...prices) / 1000) * 1000,
      maxPrice: Math.ceil(Math.max(...prices) / 1000) * 1000,
      minKm: Math.floor(Math.min(...kms) / 5000) * 5000,
      maxKm: Math.ceil(Math.max(...kms) / 5000) * 5000,
    };
  }, [filteredVehicles]);

  // Apply user filters
  const chartVehicles = useMemo(() => {
    return filteredVehicles.filter(v => 
      v.prix >= filters.minPrice && v.prix <= filters.maxPrice &&
      v.kilometrage >= filters.minKm && v.kilometrage <= filters.maxKm
    );
  }, [filteredVehicles, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (chartVehicles.length === 0) {
      return { avgPrice: 0, decotePer10k: 0, bestOffer: null, opportunitiesCount: 0 };
    }

    const avgPrice = chartVehicles.reduce((sum, v) => sum + v.prix, 0) / chartVehicles.length;
    const decotePer10k = Math.abs(trendLine.slope * 10000);

    const opportunities = chartVehicles.filter(v => {
      const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
      return v.prix < expectedPrice;
    });

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

  // Top opportunities for client view (respects filters)
  const topOpportunities = useMemo(() => {
    return chartVehicles
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
      .filter(v => v.deviationPercent >= 10)
      .sort((a, b) => b.deviationPercent - a.deviationPercent)
      .slice(0, 5);
  }, [chartVehicles, trendLine]);

  const uploadCSV = useCallback(async (file: File, marque: string, modele: string) => {
    setIsLoading(true);
    try {
      const parsed = await parseCSVFile(file);
      // Pass forced brand/model to scoring function
      const scored = calculateDealScores(parsed, marque, modele);
      setVehicles(scored);
      setVehicleInfo({ marque, modele });
      // Reset filters to data range
      const prices = scored.map(v => v.prix);
      const kms = scored.map(v => v.kilometrage);
      setFiltersState({
        minPrice: 0,
        maxPrice: Math.ceil(Math.max(...prices) / 1000) * 1000,
        minKm: 0,
        maxKm: Math.ceil(Math.max(...kms) / 5000) * 5000,
      });
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setVehicles([]);
    setVehicleInfo(null);
    setFiltersState({ minPrice: 0, maxPrice: 999999, minKm: 0, maxKm: 999999 });
  }, []);

  const setFilters = useCallback((newFilters: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      minPrice: dataRanges.minPrice,
      maxPrice: dataRanges.maxPrice,
      minKm: dataRanges.minKm,
      maxKm: dataRanges.maxKm,
    });
  }, [dataRanges]);

  return (
    <VehicleDataContext.Provider value={{
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
      topOpportunities,
      kpis,
    }}>
      {children}
    </VehicleDataContext.Provider>
  );
}

export function useVehicleData() {
  const context = useContext(VehicleDataContext);
  if (!context) {
    throw new Error('useVehicleData must be used within a VehicleDataProvider');
  }
  return context;
}
