import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  Printer, 
  CheckCircle, 
  TrendingDown, 
  Car, 
  Gauge,
  ExternalLink,
  MapPin,
  Calendar,
  Fuel
} from 'lucide-react';
import logoTruffe from '@/assets/logo-truffe.jpg';
import { PriceGauge } from '@/components/landing/PriceGauge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

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
  // New analysis fields
  prix_moyen: number | null;
  prix_truffe: number | null;
  economie_moyenne: number | null;
  decote_par_10k: number | null;
  total_vehicules: number | null;
  opportunites_count: number | null;
  vehicles_data: Vehicle[] | null;
}

interface Vehicle {
  id: string;
  titre: string;
  marque: string;
  modele: string;
  prix: number;
  kilometrage: number;
  annee: number | null;
  carburant: string | null;
  transmission: string | null;
  localisation: string | null;
  image: string | null;
  lien: string | null;
  prix_median_segment: number | null;
  gain_potentiel: number | null;
  score_confiance: number | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch report with all analysis data
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
      
      // Cast to our Report interface (Supabase types may not have new columns yet)
      const report = reportData as unknown as Report;
      setReport(report);
      
      // Use vehicles_data from the report if available (published from admin)
      if (report.vehicles_data && Array.isArray(report.vehicles_data)) {
        setVehicles(report.vehicles_data);
      } else {
        // Fallback to fetching from vehicles table (legacy behavior)
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .ilike('modele', `%${report.modele.split(' ')[0]}%`)
          .order('gain_potentiel', { ascending: false, nullsFirst: false })
          .limit(10);
        
        setVehicles(vehiclesData || []);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [user, id, toast, navigate]);

  const handlePrint = () => {
    window.print();
  };

  // Use stored KPIs from report if available, otherwise calculate from vehicles
  const avgMarketPrice = report?.prix_moyen ?? (vehicles.length > 0 
    ? vehicles.reduce((acc, v) => acc + (v.prix_median_segment || v.prix), 0) / vehicles.length 
    : 0);
  const avgActualPrice = report?.prix_truffe ?? (vehicles.length > 0 
    ? vehicles.reduce((acc, v) => acc + v.prix, 0) / vehicles.length 
    : 0);
  const avgSavings = report?.economie_moyenne ?? (vehicles.length > 0
    ? vehicles.reduce((acc, v) => acc + (v.gain_potentiel || 0), 0) / vehicles.length
    : 0);

  // Generate chart data from vehicles
  const chartData = vehicles
    .filter(v => v.prix && v.kilometrage)
    .sort((a, b) => a.kilometrage - b.kilometrage)
    .map(v => ({
      km: v.kilometrage,
      prix: v.prix,
      marche: v.prix_median_segment || v.prix * 1.1
    }));

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - Hidden on print */}
      <header className="bg-card border-b border-border sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-10 w-10 rounded-lg object-cover shadow-corporate"
              />
              <span className="text-xl font-bold text-foreground">La Truffe</span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8 print:py-4">
        {/* Report Header */}
        <div className="text-center space-y-4 print:space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-sm px-4 py-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              AUDIT COMPLÉTÉ
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground print:text-2xl">
            Audit de Prix : {report.modele}
          </h1>
          <p className="text-muted-foreground">
            Généré le {new Date(report.updated_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Section 1: Key Figures */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
          <Card className="corporate-card border-2 border-muted">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Prix Marché Moyen</div>
              <div className="text-3xl font-bold text-foreground print:text-2xl">
                {formatCurrency(avgMarketPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basé sur {vehicles.length} annonces
              </p>
            </CardContent>
          </Card>
          
          <Card className="corporate-card border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Prix La Truffe</div>
              <div className="text-3xl font-bold text-primary print:text-2xl">
                {formatCurrency(avgActualPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos meilleures sélections
              </p>
            </CardContent>
          </Card>
          
          <Card className="corporate-card border-2 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Économie Potentielle</div>
              <div className="text-3xl font-bold text-green-600 print:text-2xl">
                {formatCurrency(avgSavings)}
              </div>
              <TrendingDown className="h-5 w-5 text-green-600 mx-auto mt-1" />
            </CardContent>
          </Card>
        </section>

        {/* Price Gauge */}
        <section className="print:hidden">
          <Card className="corporate-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Positionnement Prix
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-md">
                <PriceGauge 
                  marketPrice={avgMarketPrice} 
                  ourPrice={avgActualPrice} 
                  savings={avgSavings}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Top Opportunities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 print:text-xl">
              <Car className="h-6 w-6 text-primary" />
              Top {vehicles.length} Opportunités
            </h2>
          </div>
          
          {vehicles.length === 0 ? (
            <Card className="corporate-card text-center py-12">
              <CardContent>
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">Analyse en cours</h3>
                <p className="text-muted-foreground">
                  Les opportunités seront affichées ici une fois l'analyse terminée
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 print:space-y-2">
              {vehicles.map((vehicle, index) => (
                <Card 
                  key={vehicle.id} 
                  className="corporate-card hover:shadow-lg transition-shadow print:shadow-none print:border"
                >
                  <CardContent className="p-4 print:p-2">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary print:bg-gray-100">
                        #{index + 1}
                      </div>
                      
                      {/* Image */}
                      <div className="flex-shrink-0 w-full md:w-32 h-24 rounded-lg overflow-hidden bg-muted print:hidden">
                        {vehicle.image ? (
                          <img 
                            src={vehicle.image} 
                            alt={vehicle.titre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-lg print:text-base">
                          {vehicle.titre || `${vehicle.marque} ${vehicle.modele}`}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          {vehicle.annee && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {vehicle.annee}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Gauge className="h-4 w-4" />
                            {formatNumber(vehicle.kilometrage)} km
                          </span>
                          {vehicle.carburant && (
                            <span className="flex items-center gap-1">
                              <Fuel className="h-4 w-4" />
                              {vehicle.carburant}
                            </span>
                          )}
                          {vehicle.localisation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {vehicle.localisation}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Price & Savings */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <div className="text-2xl font-bold text-foreground print:text-xl">
                          {formatCurrency(vehicle.prix)}
                        </div>
                        {vehicle.gain_potentiel && vehicle.gain_potentiel > 0 && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 font-bold">
                            -{formatCurrency(vehicle.gain_potentiel)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      {vehicle.lien && (
                        <div className="flex-shrink-0 print:hidden">
                          <Button 
                            onClick={() => window.open(vehicle.lien!, '_blank')}
                            className="gap-2"
                          >
                            Voir l'annonce
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Price Distribution Chart */}
        {chartData.length > 2 && (
          <section className="print:hidden">
            <Card className="corporate-card">
              <CardHeader>
                <CardTitle>Distribution des Prix par Kilométrage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="km" 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `${formatNumber(label)} km`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="marche" 
                        stroke="hsl(var(--muted-foreground))" 
                        fill="hsl(var(--muted))"
                        name="Prix Marché"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="prix" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)"
                        name="Nos Prix"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Admin Notes */}
        {report.admin_notes && (
          <section>
            <Card className="corporate-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Note de l'équipe La Truffe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{report.admin_notes}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Footer - Print only */}
        <footer className="hidden print:block border-t pt-4 mt-8 text-center text-xs text-gray-500">
          <p>Document généré par l'algorithme La Truffe. Ne constitue pas une garantie mécanique.</p>
          <p className="mt-1">© {new Date().getFullYear()} La Truffe - Tous droits réservés</p>
        </footer>
      </main>
    </div>
  );
};

export default ReportView;
