import { VehicleWithScore } from '@/lib/csvParser';
import { Car, ExternalLink, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientOpportunityCardProps {
  vehicle: VehicleWithScore & {
    expectedPrice: number;
    deviation: number;
    deviationPercent: number;
  };
  rank: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanModelName(model: string): string {
  const corrections: Record<string, string> = {
    'GOLE': 'Golf',
    'GOLFE': 'Golf',
    'GOF': 'Golf',
  };
  const upper = model.toUpperCase().trim();
  return corrections[upper] || model;
}

// Calculate a deal score out of 10 based on deviation percentage
function calculateDealScore(deviationPercent: number): number {
  // deviationPercent is how much below trend (e.g., 20 = 20% below)
  // Score: 15%+ = 10/10, 10% = 8/10, 5% = 6/10, etc.
  const score = Math.min(10, 5 + (deviationPercent / 3));
  return Math.round(score * 10) / 10; // One decimal
}

export function ClientOpportunityCard({ vehicle, rank }: ClientOpportunityCardProps) {
  const dealScore = calculateDealScore(vehicle.deviationPercent);
  const hasImage = vehicle.image && vehicle.image.length > 10;

  return (
    <div className="relative glass-card overflow-hidden group hover:border-success/50 transition-all duration-300">
      {/* Rank badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
          #{rank}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {hasImage ? (
            <img
              src={vehicle.image}
              alt={`${vehicle.marque} ${vehicle.modele}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${hasImage ? 'hidden' : ''}`}>
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold text-foreground truncate">
            {cleanModelName(vehicle.modele)} {vehicle.annee}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {vehicle.marque} • {vehicle.kilometrage.toLocaleString('fr-FR')} km
          </p>

          {/* Prices */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prix Marché :</span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(vehicle.expectedPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prix Annonce :</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(vehicle.prix)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Score & Badge */}
        <div className="flex flex-col items-end justify-between">
          {/* Deal Score */}
          <div className="text-center">
            <div className="flex items-center gap-1 text-gold mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">SCORE LA TRUFFE</span>
            </div>
            <div className="text-2xl font-bold text-gold">
              {dealScore}<span className="text-sm font-normal">/10</span>
            </div>
          </div>

          {/* Savings Badge */}
          <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">
            Économie : {formatCurrency(vehicle.deviation)}
          </Badge>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4">
        {vehicle.lien ? (
          <Button
            variant="gold"
            className="w-full gap-2"
            onClick={() => window.open(vehicle.lien, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Voir l'annonce
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled>
            Lien non disponible
          </Button>
        )}
      </div>
    </div>
  );
}
