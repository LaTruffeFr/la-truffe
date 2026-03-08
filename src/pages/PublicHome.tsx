import { useMemo, useRef, useCallback } from 'react';
import { SavingsSimulator } from '@/components/trading/SavingsSimulator';
import { FreemiumDealCard } from '@/components/trading/FreemiumDealCard';
import { CSVImportModal } from '@/components/trading/CSVImportModal';
import { useVehicleData } from '@/contexts/VehicleDataContext';
import { Loader2, Crosshair, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import logoTruffe from '@/assets/logo-truffe-new.png';

export default function PublicHome() {
  const {
    vehicles,
    chartVehicles,
    trendLine,
    isLoading,
    loadingProgress,
    vehicleInfo,
    uploadCSV,
  } = useVehicleData();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const dealsRef = useRef<HTMLDivElement>(null);

  const handleScrollToDeals = useCallback(() => {
    dealsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleImport = useCallback((file: File, marque: string, modele: string) => {
    uploadCSV(file, marque, modele);
  }, [uploadCSV]);

  // Top 3 freemium deals (best opportunities)
  const freemiumDeals = useMemo(() => {
    return [...chartVehicles]
      .filter(v => v.dealScore < 0)
      .sort((a, b) => a.dealScore - b.dealScore)
      .slice(0, 3)
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
        <div className="text-center space-y-4 w-72">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Chargement...</p>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{loadingProgress}%</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoTruffe} alt="La Truffe" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold text-foreground">La Truffe</h1>
              <p className="text-xs text-muted-foreground">Trouvez les meilleures affaires</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Crosshair className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Aucune analyse en cours</h2>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que notre équipe prépare les meilleures opportunités pour vous.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Public Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoTruffe} alt="La Truffe" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                La Truffe
                {vehicleInfo && (
                  <span className="ml-2 text-sm font-normal text-primary">
                    — {vehicleInfo.marque} {vehicleInfo.modele}
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">Dénicheur d'opportunités automobiles</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Savings Simulator */}
        <SavingsSimulator 
          vehicles={chartVehicles} 
          onScrollToDeals={handleScrollToDeals} 
        />

        {/* Freemium Deal Cards */}
        <div ref={dealsRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">🔥 TOP 3 OPPORTUNITÉS</h2>
            <span className="text-sm text-muted-foreground">Aperçu des meilleures affaires</span>
          </div>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
            {freemiumDeals.map((vehicle, index) => (
              <FreemiumDealCard
                key={vehicle.id || index}
                vehicle={vehicle}
                rank={index + 1}
                paymentLink="#"
              />
            ))}
          </div>
          {freemiumDeals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune opportunité détectée
            </div>
          )}
        </div>

        {/* Trust Section */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">🎯 Analyse basée sur l'IA</h3>
          <p className="text-sm text-muted-foreground">
            Notre algorithme analyse des centaines d'annonces pour identifier les véhicules sous-cotés par rapport au marché.
          </p>
        </div>
      </div>

      {/* Import Modal (hidden for public but needed for context) */}
      <CSVImportModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
        onImport={handleImport}
      />
    </div>
  );
}
