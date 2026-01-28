import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
// CORRECTION ICI : On importe les bons types et la bonne fonction
import { parseCSVFile, ParsedVehicle, VehicleWithScore } from '@/lib/csvParser';
import { useToast } from '@/hooks/use-toast';
import { calculateSmartScore, filterOutliers } from '@/lib/vehicleAnalysis';

interface VehicleInfo {
  marque: string;
  modele: string;
}

interface FilterState {
  minPrice: number;
  maxPrice: number;
  minKm: number;
  maxKm: number;
  minYear: number;
  maxYear: number;
}

interface KPIState {
  avgPrice: number;
  decotePer10k: number;
  bestOffer: VehicleWithScore | null;
  opportunitiesCount: number;
}

interface VehicleDataContextType {
  vehicles: VehicleWithScore[];
  filteredVehicles: VehicleWithScore[];
  chartVehicles: VehicleWithScore[]; 
  outliersCount: number;
  trendLine: { slope: number; intercept: number };
  filters: FilterState;
  dataRanges: FilterState;
  isLoading: boolean;
  vehicleInfo: VehicleInfo | null;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  uploadCSV: (file: File, marque: string, modele: string) => void;
  clearData: () => void;
  kpis: KPIState;
}

const VehicleDataContext = createContext<VehicleDataContextType | undefined>(undefined);

export const VehicleDataProvider = ({ children }: { children: React.ReactNode }) => {
  // CORRECTION ICI : Le type est ParsedVehicle[] ou VehicleWithScore[]
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outliersCount, setOutliersCount] = useState(0);
  const { toast } = useToast();

  const [filters, setFiltersState] = useState<FilterState>({
    minPrice: 0, maxPrice: 100000,
    minKm: 0, maxKm: 200000,
    minYear: 2000, maxYear: new Date().getFullYear()
  });

  const dataRanges = useMemo(() => {
    if (vehicles.length === 0) return { minPrice: 0, maxPrice: 100000, minKm: 0, maxKm: 200000, minYear: 2000, maxYear: new Date().getFullYear() };
    return {
      minPrice: Math.min(...vehicles.map(v => v.prix)),
      maxPrice: Math.max(...vehicles.map(v => v.prix)),
      minKm: Math.min(...vehicles.map(v => v.kilometrage)),
      maxKm: Math.max(...vehicles.map(v => v.kilometrage)),
      minYear: Math.min(...vehicles.map(v => v.annee)),
      maxYear: Math.max(...vehicles.map(v => v.annee)),
    };
  }, [vehicles]);

  const uploadCSV = useCallback(async (file: File, marque: string, modele: string) => {
    setIsLoading(true);
    try {
      // CORRECTION ICI : Utilisation de parseCSVFile directement
      const rawVehicles = await parseCSVFile(file);
      
      if (rawVehicles.length === 0) throw new Error("Aucun véhicule trouvé dans le CSV");

      // 2. Filtrage intelligent
      const cleanVehicles = filterOutliers(rawVehicles);
      const rejectedCount = rawVehicles.length - cleanVehicles.length;

      // 3. Calcul du Score Intelligent (V2)
      const scoredVehicles = calculateSmartScore(cleanVehicles);

      setVehicles(scoredVehicles);
      setVehicleInfo({ marque, modele });
      setOutliersCount(rejectedCount);

      const maxP = Math.max(...scoredVehicles.map(v => v.prix));
      const maxK = Math.max(...scoredVehicles.map(v => v.kilometrage));
      const minY = Math.min(...scoredVehicles.map(v => v.annee));
      const maxY = Math.max(...scoredVehicles.map(v => v.annee));

      setFiltersState({
        minPrice: 0, maxPrice: maxP,
        minKm: 0, maxKm: maxK,
        minYear: minY, maxYear: maxY
      });

      toast({ 
        title: "Import réussi", 
        description: `${scoredVehicles.length} annonces analysées (${rejectedCount} exclues).`,
        className: "bg-green-600 text-white border-0"
      });

    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Erreur d'import", 
        description: error.message || "Le fichier CSV semble invalide.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearData = () => {
    setVehicles([]);
    setVehicleInfo(null);
    setOutliersCount(0);
  };

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFiltersState(dataRanges);
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.prix >= filters.minPrice && v.prix <= filters.maxPrice &&
      v.kilometrage >= filters.minKm && v.kilometrage <= filters.maxKm &&
      v.annee >= filters.minYear && v.annee <= filters.maxYear
    );
  }, [vehicles, filters]);

  const chartVehicles = filteredVehicles;

  const trendLine = useMemo(() => {
    if (chartVehicles.length < 2) return { slope: 0, intercept: 0 };
    
    const n = chartVehicles.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    chartVehicles.forEach(v => {
      const x = v.kilometrage;
      const y = v.prix;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }, [chartVehicles]);

  const kpis = useMemo(() => {
    if (chartVehicles.length === 0) return { avgPrice: 0, decotePer10k: 0, bestOffer: null, opportunitiesCount: 0 };
    
    const avgPrice = Math.round(chartVehicles.reduce((acc, v) => acc + v.prix, 0) / chartVehicles.length);
    const decote = Math.round(trendLine.slope * 10000); 
    
    const sortedByScore = [...chartVehicles].sort((a, b) => b.dealScore - a.dealScore);
    const bestOffer = sortedByScore[0];
    const opportunitiesCount = chartVehicles.filter(v => v.dealScore > 70).length;

    return { 
      avgPrice, 
      decotePer10k: decote, 
      bestOffer: bestOffer as any, 
      opportunitiesCount 
    };
  }, [chartVehicles, trendLine]);

  return (
    <VehicleDataContext.Provider value={{
      vehicles,
      filteredVehicles,
      chartVehicles,
      outliersCount,
      trendLine,
      filters,
      dataRanges,
      isLoading,
      vehicleInfo,
      setFilters,
      resetFilters,
      uploadCSV,
      clearData,
      kpis
    }}>
      {children}
    </VehicleDataContext.Provider>
  );
};

export const useVehicleData = () => {
  const context = useContext(VehicleDataContext);
  if (context === undefined) {
    throw new Error('useVehicleData must be used within a VehicleDataProvider');
  }
  return context;
};