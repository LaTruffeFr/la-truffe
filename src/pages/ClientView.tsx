import { useVehicleData } from '@/contexts/VehicleDataContext';
import { ClientOpportunityCard } from '@/components/trading/ClientOpportunityCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoTruffe from '@/assets/logo-truffe.jpg';

export default function ClientView() {
  const navigate = useNavigate();
  const { topOpportunities, filters, chartVehicles, vehicles } = useVehicleData();

  // No data - redirect to main page
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Aucune donnée disponible</h1>
          <p className="text-muted-foreground">Importez d'abord un fichier CSV sur le tableau de bord.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="border-b border-gold/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3">
            <img 
              src={logoTruffe} 
              alt="La Truffe" 
              className="w-10 h-10 rounded-full object-cover border-2 border-gold/50"
            />
            <span className="text-lg font-bold text-gradient-gold">La Truffe</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">Sélection Premium</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient-gold">Top Opportunités</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Voici les meilleures affaires du marché, sélectionnées par notre algorithme d'analyse.
          </p>
        </div>

        {/* Active Filters Summary */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm">
            <span className="text-muted-foreground">Budget :</span>{' '}
            <span className="font-medium">
              {filters.minPrice.toLocaleString('fr-FR')} € - {filters.maxPrice.toLocaleString('fr-FR')} €
            </span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm">
            <span className="text-muted-foreground">Kilométrage :</span>{' '}
            <span className="font-medium">
              {filters.minKm.toLocaleString('fr-FR')} km - {filters.maxKm.toLocaleString('fr-FR')} km
            </span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20 text-sm">
            <span className="text-success font-medium">{chartVehicles.length} véhicules analysés</span>
          </div>
        </div>

        {/* Opportunities Grid */}
        {topOpportunities.length > 0 ? (
          <div className="space-y-4">
            {topOpportunities.map((vehicle, index) => (
              <ClientOpportunityCard
                key={vehicle.id || `${vehicle.marque}-${vehicle.modele}-${index}`}
                vehicle={vehicle}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Aucune opportunité exceptionnelle</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Avec les filtres actuels, aucun véhicule n'est au moins 10% sous le prix du marché.
              Essayez d'élargir vos critères de recherche.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="mt-6">
              Modifier les filtres
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Analyse générée par l'algorithme La Truffe</p>
          <p className="mt-1">Les prix estimés sont basés sur l'analyse de {chartVehicles.length} véhicules similaires</p>
        </div>
      </div>
    </div>
  );
}
