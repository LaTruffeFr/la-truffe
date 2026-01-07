import { VehicleWithScore } from '@/lib/csvParser';
import { Car, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FreemiumDealCardProps {
  vehicle: VehicleWithScore & {
    expectedPrice: number;
    deviation: number;
    deviationPercent: number;
  };
  rank: number;
  paymentLink?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function FreemiumDealCard({ vehicle, rank, paymentLink = "#" }: FreemiumDealCardProps) {
  const hasImage = vehicle.image && vehicle.image.length > 10;

  const handleUnlock = () => {
    window.open(paymentLink, '_blank');
  };

  return (
    <div className="relative glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
      {/* Rank badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
          #{rank}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* Image - Visible */}
        <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {hasImage ? (
            <img
              src={vehicle.image}
              alt="Véhicule"
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
          {/* Title & Location - BLURRED */}
          <h3 className="text-lg font-bold text-foreground truncate blur-[6px] select-none pointer-events-none">
            {vehicle.marque} {vehicle.modele} {vehicle.annee}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 blur-[5px] select-none pointer-events-none">
            {vehicle.localisation || "Île-de-France"} • {vehicle.kilometrage.toLocaleString('fr-FR')} km
          </p>

          {/* Price - VISIBLE */}
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

        {/* Right side - Savings Badge */}
        <div className="flex flex-col items-end justify-center">
          <Badge className="bg-success/20 text-success border-success/30 px-3 py-1 text-base">
            -{formatCurrency(vehicle.deviation)}
          </Badge>
        </div>
      </div>

      {/* Locked Action Button */}
      <div className="px-4 pb-4">
        <Button
          variant="destructive"
          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg"
          onClick={handleUnlock}
        >
          <Lock className="w-4 h-4" />
          DÉBLOQUER LES LIENS (19€)
        </Button>
      </div>
    </div>
  );
}
