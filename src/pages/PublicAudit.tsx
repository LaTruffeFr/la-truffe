import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  TrendingDown, 
  Car, 
  Gauge,
  ExternalLink,
  MapPin,
  Calendar,
  Fuel,
  AlertCircle
} from 'lucide-react';
import logoTruffe from '@/assets/logo-truffe.jpg';
import { PriceGauge } from '@/components/landing/PriceGauge';
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
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
  admin_notes: string | null;
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
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const PublicAudit = () => {
  // The URL param is now a share_token instead of report ID
  const { id: shareToken } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-public-report', {
          body: { shareToken }
        });
        
        if (fetchError || data?.error) {
          console.error('Error fetching report:', fetchError || data?.error);
          setError(data?.error || 'Rapport introuvable ou non disponible');
          return;
        }
        
        setReport(data.report);
        // Extract vehicles from the report's vehicles_data JSONB column
        const vehiclesData = data.report?.vehicles_data || [];
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      } catch (err) {
        console.error('Error:', err);
        setError('Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [shareToken]);

  // Calculate KPIs
  const avgMarketPrice = vehicles.length > 0 
    ? vehicles.reduce((acc, v) => acc + (v.prix_median_segment || v.prix), 0) / vehicles.length 
    : 0;
  const avgActualPrice = vehicles.length > 0 
    ? vehicles.reduce((acc, v) => acc + v.prix, 0) / vehicles.length 
    : 0;
  const totalSavings = vehicles.reduce((acc, v) => acc + (v.gain_potentiel || 0), 0);
  const avgSavings = vehicles.length > 0 ? totalSavings / vehicles.length : 0;

  const chartData = vehicles
    .filter(v => v.prix && v.kilometrage)
    .sort((a, b) => a.kilometrage - b.kilometrage)
    .map(v => ({
      km: v.kilometrage,
      prix: v.prix,
      marche: v.prix_median_segment || v.prix * 1.1
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de votre audit...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Audit non disponible</h2>
            <p className="text-muted-foreground mb-4">{error || 'Ce rapport n\'existe pas ou n\'est pas encore prêt.'}</p>
            <Button onClick={() => window.location.href = '/'}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-10 w-10 rounded-lg object-cover shadow-md"
              />
              <span className="text-xl font-bold text-foreground">La Truffe</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Audit Public
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Report Header */}
        <div className="text-center space-y-4">
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-sm px-4 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            AUDIT COMPLÉTÉ
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Audit de Prix : {report.marque} {report.modele}
          </h1>
          <p className="text-muted-foreground">
            Généré le {new Date(report.updated_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Key Figures */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-muted">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Prix Marché Moyen</div>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(avgMarketPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basé sur {vehicles.length} annonces
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Prix La Truffe</div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(avgActualPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos meilleures sélections
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Économie Potentielle</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(avgSavings)}
              </div>
              <TrendingDown className="h-5 w-5 text-green-600 mx-auto mt-1" />
            </CardContent>
          </Card>
        </section>

        {/* Price Gauge */}
        <section>
          <Card>
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

        {/* Top Opportunities */}
        <section>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
            <Car className="h-6 w-6 text-primary" />
            Top {vehicles.length} Opportunités
          </h2>
          
          {vehicles.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">Aucune opportunité</h3>
                <p className="text-muted-foreground">
                  Pas de véhicules correspondants trouvés
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle, index) => (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        #{index + 1}
                      </div>
                      
                      {/* Image */}
                      <div className="flex-shrink-0 w-full md:w-32 h-24 rounded-lg overflow-hidden bg-muted">
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
                        <h3 className="font-semibold text-foreground truncate text-lg">
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
                        <div className="text-2xl font-bold text-foreground">
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
                        <div className="flex-shrink-0">
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

        {/* Chart */}
        {chartData.length > 2 && (
          <section>
            <Card>
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
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Note de l'équipe La Truffe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{report.admin_notes}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Document généré par l'algorithme La Truffe. Ne constitue pas une garantie mécanique.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            © {new Date().getFullYear()} La Truffe - Tous droits réservés
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicAudit;
