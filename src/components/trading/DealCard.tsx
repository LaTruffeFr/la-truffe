import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Calendar, Gauge, Fuel, Settings, Zap } from 'lucide-react';

interface DealCardProps {
  vehicle: VehicleWithScore;
  onClick: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

const CARBURANT_LABELS: Record<string, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  electrique: 'Électrique',
  hybride: 'Hybride',
  gpl: 'GPL',
  autre: '',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  automatique: 'Auto',
  manuelle: 'Manuelle',
  autre: '',
};

export function DealCard({ vehicle, onClick }: DealCardProps) {
  const isGreatDeal = vehicle.dealScore >= 70;
  const isGoodDeal = vehicle.dealScore >= 50;

  return (
    <div
      className={`
        h-full glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300
        ${isGreatDeal ? 'ring-1 ring-success/40 success-glow' : ''}
      `}
    >
      {/* Image */}
      <div className="relative h-36 bg-muted overflow-hidden">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.titre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1d24" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="10">No Image</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground text-sm">Pas d'image</span>
          </div>
        )}

        {/* Deal Badge */}
        <div
          className={`
            absolute top-2 right-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm
            ${isGreatDeal
              ? 'bg-success text-success-foreground'
              : isGoodDeal
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }
          `}
        >
          {vehicle.ecartPourcent > 0 ? '+' : ''}{vehicle.ecartPourcent}%
        </div>

        {/* Brand Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-background/90 backdrop-blur-sm">
          <span className="text-xs font-semibold text-foreground">{vehicle.marque}</span>
        </div>

        {/* Deal Score */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/90 backdrop-blur-sm flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isGreatDeal ? 'bg-success' : isGoodDeal ? 'bg-primary' : 'bg-muted-foreground'}`} />
          <span className="text-xs font-mono">{vehicle.dealScore}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h4 className="font-semibold text-foreground line-clamp-1 text-sm">
          {vehicle.titre}
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
            <Calendar className="w-3 h-3" />
            <span>{vehicle.annee}</span>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
            <Gauge className="w-3 h-3" />
            <span>{vehicle.kilometrage.toLocaleString('fr-FR')} km</span>
          </div>
          {vehicle.carburant !== 'autre' && (
            <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
              <Fuel className="w-3 h-3" />
              <span>{CARBURANT_LABELS[vehicle.carburant]}</span>
            </div>
          )}
          {vehicle.transmission !== 'autre' && (
            <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
              <Settings className="w-3 h-3" />
              <span>{TRANSMISSION_LABELS[vehicle.transmission]}</span>
            </div>
          )}
          {vehicle.puissance > 0 && (
            <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
              <Zap className="w-3 h-3" />
              <span>{vehicle.puissance} cv</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatCurrency(vehicle.prix)}
              </p>
              <p className="text-xs text-muted-foreground">
                Marché: {formatCurrency(vehicle.prixMoyen)}
              </p>
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="h-8 px-2"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="gold"
                size="sm"
                asChild
                className="h-8"
              >
                <a href={vehicle.lien} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
