import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  Printer, 
  CheckCircle,
  FileText,
  Calendar
} from 'lucide-react';
import logoTruffe from '@/assets/logo-truffe.jpg';
import { SniperKPIs } from '@/components/trading/SniperKPIs';
import { SniperChart } from '@/components/trading/SniperChart';
import { DealCard } from '@/components/trading/DealCard';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { VehicleWithScore } from '@/lib/csvParser';

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  marque: string;
  modele: string;
  annee_min: number | null;
  annee_max: number | null;
  kilometrage_max: number | null;
  prix_max: number | null;
  carburant: string | null;
  transmission: string | null;
  notes: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  report_url: string | null;
  admin_notes: string | null;
  prix_moyen: number | null;
  prix_truffe: number | null;
  economie_moyenne: number | null;
  decote_par_10k: number | null;
  total_vehicules: number | null;
  opportunites_count: number | null;
  vehicles_data: VehicleWithScore[] | null;
}

// Calculate trend line from vehicles data
function calculateTrendLine(data: VehicleWithScore[]): { slope: number; intercept: number } {
  if (data.length < 2) return { slope: 0, intercept: 0 };

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach(v => {
    sumX += v.kilometrage;
    sumY += v.prix;
    sumXY += v.kilometrage * v.prix;
    sumXX += v.kilometrage * v.kilometrage;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [vehicles, setVehicles] = useState<VehicleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithScore | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
      
      if (reportError || !reportData) {
        console.error('Error fetching report:', reportError);
        toast({
          title: 'Erreur',
          description: 'Rapport introuvable',
          variant: 'destructive',
        });
        navigate('/client-dashboard');
        return;
      }
      
      const report = reportData as unknown as Report;
      setReport(report);
      
      // Use vehicles_data from the report (published from admin)
      if (report.vehicles_data && Array.isArray(report.vehicles_data)) {
        // Ensure all vehicles have required fields for VehicleWithScore
        const enrichedVehicles = report.vehicles_data.map((v, index) => ({
          ...v,
          id: v.id || `vehicle-${index}`,
          clusterId: v.clusterId || `${v.marque}_${v.modele}_${v.annee}`,
          clusterSize: v.clusterSize || 1,
          coteCluster: v.coteCluster || v.prix,
          ecartEuros: v.ecartEuros || 0,
          ecartPourcent: v.ecartPourcent || 0,
          dealScore: v.dealScore || 50,
          isPremium: v.isPremium || false,
          hasEnoughData: v.hasEnoughData !== false,
          prixMoyen: v.prixMoyen || v.prix,
          prixMedian: v.prixMedian || v.prix,
          ecart: v.ecart || 0,
          segmentKey: v.segmentKey || '',
        })) as VehicleWithScore[];
        
        setVehicles(enrichedVehicles);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [user, id, toast, navigate]);

  // Calculate trend line from vehicles
  const trendLine = useMemo(() => {
    return calculateTrendLine(vehicles);
  }, [vehicles]);

  // Calculate KPIs from stored data or vehicles
  const kpis = useMemo(() => {
    const avgPrice = report?.prix_moyen || (vehicles.length > 0
      ? vehicles.reduce((acc, v) => acc + v.prix, 0) / vehicles.length
      : 0);

    const decotePer10k = report?.decote_par_10k || Math.abs(trendLine.slope * 10000);

    const opportunities = vehicles.filter(v => v.dealScore < 0 || v.ecartEuros > 0);
    const opportunitiesCount = report?.opportunites_count || opportunities.length;

    const bestOffer = opportunities.length > 0
      ? opportunities.sort((a, b) => b.ecartEuros - a.ecartEuros)[0]
      : null;

    return {
      avgPrice: Math.round(avgPrice),
      decotePer10k: Math.round(decotePer10k),
      bestOffer,
      totalVehicles: vehicles.length,
      opportunitiesCount,
    };
  }, [report, vehicles, trendLine]);

  // Top 10 deals for DealCard display
  const topDeals = useMemo(() => {
    return [...vehicles]
      .filter(v => v.ecartEuros > 0 || v.dealScore < 0)
      .sort((a, b) => b.ecartEuros - a.ecartEuros)
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
  }, [vehicles, trendLine]);

  // Handle vehicle click from chart
  const handleVehicleClick = useCallback((vehicle: VehicleWithScore) => {
    const expectedPrice = trendLine.slope * vehicle.kilometrage + trendLine.intercept;
    setSelectedVehicle({
      ...vehicle,
      expectedPrice: Math.round(expectedPrice),
      deviation: Math.round(expectedPrice - vehicle.prix),
      deviationPercent: Math.round(((expectedPrice - vehicle.prix) / expectedPrice) * 100),
    } as any);
  }, [trendLine]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!report) {
    return null;
  }

  const isCompleted = report.status === 'completed';

  return (
    <div className="min-h-screen flex flex-col bg-background print:bg-white">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-10 w-10 rounded-lg object-cover shadow-corporate"
              />
              <div>
                <span className="text-xl font-bold text-foreground">La Truffe</span>
                <p className="text-xs text-muted-foreground">Audit de Prix Automobile</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Report Header */}
      <div className="bg-card/50 border-b border-border px-6 py-6 print:py-4">
        <div className="container mx-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className={`${isCompleted ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'} text-sm px-4 py-1`}>
                  {isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      AUDIT COMPLÉTÉ
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      EN COURS
                    </>
                  )}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground print:text-2xl">
                {report.marque} {report.modele}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rapport généré le {new Date(report.updated_at).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Référence</p>
              <p className="font-mono text-sm text-foreground">{report.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!isCompleted || vehicles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Analyse en cours</h2>
              <p className="text-muted-foreground">
                Notre équipe analyse actuellement le marché pour trouver les meilleures opportunités. 
                Vous recevrez une notification dès que le rapport sera prêt.
              </p>
            </div>
            {report.notes && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-left">
                <p className="text-sm font-medium text-foreground mb-1">Vos notes :</p>
                <p className="text-sm text-muted-foreground">{report.notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* KPIs Bar - Same as Admin */}
          <SniperKPIs
            avgPrice={kpis.avgPrice}
            decotePer10k={kpis.decotePer10k}
            bestOffer={kpis.bestOffer}
            totalVehicles={kpis.totalVehicles}
            opportunitiesCount={kpis.opportunitiesCount}
          />

          <div className="p-6 space-y-8">
            {/* Vehicle Info Header */}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Analyse du marché : {report.marque} {report.modele}
              </h2>
              <p className="text-sm text-muted-foreground">
                {vehicles.length} véhicules analysés sur le marché
              </p>
            </div>

            {/* Sniper Chart - Interactive */}
            <div className="rounded-xl border border-border bg-card overflow-hidden print:hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Graphique Prix vs Kilométrage</h3>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur un point <span className="text-success font-medium">vert</span> pour voir les détails de l'opportunité
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-6 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">Opportunité (sous la tendance)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/50" />
                    <span className="text-muted-foreground">Au-dessus de la tendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-destructive" />
                    <span className="text-muted-foreground">Ligne de tendance</span>
                  </div>
                </div>
                <div className="h-[400px]">
                  <SniperChart
                    data={vehicles}
                    onVehicleClick={handleVehicleClick}
                    trendLine={trendLine}
                  />
                </div>
              </div>
            </div>

            {/* Top Opportunities - Using DealCard */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">🎯 TOP {topDeals.length} OPPORTUNITÉS</h2>
                <span className="text-sm text-success font-medium">Meilleures affaires détectées</span>
              </div>
              
              {topDeals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 print:grid-cols-1">
                  {topDeals.map((vehicle, index) => (
                    <DealCard
                      key={vehicle.id || index}
                      vehicle={vehicle}
                      rank={index + 1}
                      onClick={() => handleVehicleClick(vehicle)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border border-border bg-muted/30">
                  <p className="text-muted-foreground">Aucune opportunité détectée dans ce dataset</p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {report.admin_notes && (
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">💡 Recommandation de l'équipe La Truffe</h3>
                <p className="text-foreground">{report.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>La Truffe - Audit de Prix Automobile</span>
          <span>{new Date().toLocaleDateString('fr-FR')}</span>
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
};

export default ReportView;
