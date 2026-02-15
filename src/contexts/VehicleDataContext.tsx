import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { parseCSVFile, ParsedVehicle, VehicleWithScore, AIAnalysis } from '@/lib/csvParser';
import { useToast } from '@/hooks/use-toast';
import { calculateSmartScore, filterOutliers } from '@/lib/vehicleAnalysis';
import { supabase } from '@/integrations/supabase/client';

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
  isAnalyzingAI: boolean;
  vehicleInfo: VehicleInfo | null;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  uploadCSV: (file: File, marque: string, modele: string) => void;
  clearData: () => void;
  kpis: KPIState;
}

const VehicleDataContext = createContext<VehicleDataContextType | undefined>(undefined);

export const VehicleDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
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

  const runAIAnalysis = useCallback(async (scoredVehicles: VehicleWithScore[]) => {
    const withDesc = scoredVehicles.filter(v => v.description && v.description.trim().length > 20);
    if (withDesc.length === 0) return;

    setIsAnalyzingAI(true);
    try {
      const vehicleInputs = withDesc.map(v => ({
        id: v.id,
        titre: v.titre,
        marque: v.marque,
        modele: v.modele,
        prix: v.prix,
        kilometrage: v.kilometrage,
        annee: v.annee,
        description: v.description,
      }));

      const { data, error } = await supabase.functions.invoke('analyze-vehicles', {
        body: { vehicles: vehicleInputs },
      });

      if (error) {
        console.error('AI analysis error:', error);
        return;
      }

      if (data?.analyses && Array.isArray(data.analyses)) {
        const analysisMap = new Map<string, AIAnalysis>();
        for (const a of data.analyses) {
          analysisMap.set(a.id, {
            options: a.options || [],
            etat: a.etat || '',
            pointsForts: a.pointsForts || [],
            pointsFaibles: a.pointsFaibles || [],
            resumeClient: a.resumeClient || '',
            bonusScore: a.bonusScore || 0,
          });
        }

        setVehicles(prev => prev.map(v => {
          const ai = analysisMap.get(v.id);
          if (!ai) return v;
          // Apply AI bonus to deal score
          const adjustedScore = Math.max(10, Math.min(99, v.dealScore + ai.bonusScore));
          return { ...v, aiAnalysis: ai, dealScore: adjustedScore };
        }));

        toast({
          title: "Analyse IA terminée",
          description: `${data.analyses.length} annonces enrichies par l'IA.`,
          className: "bg-blue-600 text-white border-0"
        });
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  }, [toast]);

  // Dedup key: normalize title + price + km to detect identical listings
  const getDeduplicationKey = useCallback((v: ParsedVehicle) => {
    return `${v.titre.trim().toLowerCase()}_${v.prix}_${v.kilometrage}`;
  }, []);

  const uploadCSV = useCallback(async (file: File, marque: string, modele: string) => {
    setIsLoading(true);
    try {
      const rawVehicles = await parseCSVFile(file);
      
      if (rawVehicles.length === 0) throw new Error("Aucun véhicule trouvé dans le CSV");

      const cleanVehicles = filterOutliers(rawVehicles);
      const rejectedCount = rawVehicles.length - cleanVehicles.length;

      const scoredVehicles = calculateSmartScore(cleanVehicles);

      // Merge with existing vehicles, deduplicating by title+price+km
      setVehicles(prev => {
        const existingKeys = new Set(prev.map(v => getDeduplicationKey(v)));
        const newUnique = scoredVehicles.filter(v => !existingKeys.has(getDeduplicationKey(v)));
        const merged = [...prev, ...newUnique];
        const duplicatesRemoved = scoredVehicles.length - newUnique.length;

        // Update filters based on merged dataset
        const maxP = Math.max(...merged.map(v => v.prix));
        const maxK = Math.max(...merged.map(v => v.kilometrage));
        const minY = Math.min(...merged.map(v => v.annee));
        const maxY = Math.max(...merged.map(v => v.annee));

        setFiltersState({
          minPrice: 0, maxPrice: maxP,
          minKm: 0, maxKm: maxK,
          minYear: minY, maxYear: maxY
        });

        const desc = duplicatesRemoved > 0
          ? `${newUnique.length} nouvelles annonces ajoutées (${rejectedCount} exclues, ${duplicatesRemoved} doublons ignorés).`
          : `${scoredVehicles.length} annonces analysées (${rejectedCount} exclues).`;

        toast({ 
          title: "Import réussi", 
          description: desc,
          className: "bg-green-600 text-white border-0"
        });

        // Launch AI analysis only on new vehicles
        if (newUnique.length > 0) runAIAnalysis(newUnique);

        return merged;
      });

      setVehicleInfo({ marque, modele });
      setOutliersCount(prev => prev + rejectedCount);

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
  }, [toast, runAIAnalysis, getDeduplicationKey]);

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
      isAnalyzingAI,
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