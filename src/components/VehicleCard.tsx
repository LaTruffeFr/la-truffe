import { ExternalLink, Calendar, Gauge, Fuel, Shield, Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/types/vehicle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

const CARBURANT_LABELS: Record<string, string> = {
  'essence': 'Essence',
  'diesel': 'Diesel',
  'electrique': 'Électrique',
  'hybride': 'Hybride',
  'gpl': 'GPL',
  'autre': '',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  'automatique': 'Auto',
  'manuelle': 'Manuelle',
  'autre': '',
};

export function VehicleCard({ vehicle, index }: VehicleCardProps) {
  const gain = vehicle.gainPotentiel || 0;
  const isOpportunity = gain > 1000;
  const confidence = vehicle.scoreConfiance || 0;

  return (
    <div
      className={`
        glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300
        animate-fade-in ${isOpportunity ? 'ring-1 ring-success/30' : ''}
      `}
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      {/* Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1d24" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No Image</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">Pas d'image</span>
          </div>
        )}

        {/* Gain Badge */}
        <div
          className={`
            absolute top-3 right-3 px-3 py-1.5 rounded-full font-mono font-bold text-sm
            ${gain > 2000
              ? 'bg-success text-success-foreground success-glow'
              : gain > 0
                ? 'bg-success/80 text-success-foreground'
                : gain > -1000
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-destructive text-destructive-foreground'
            }
          `}
        >
          {gain > 0 ? '+' : ''}{formatCurrency(gain)}
        </div>

        {/* Brand Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-foreground">{vehicle.marque}</span>
        </div>

        {/* Confidence indicator with tooltip */}
        {confidence > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-background/80 backdrop-blur-sm cursor-help">
                  <Shield className={`w-3 h-3 ${confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground">{confidence}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="text-xs">
                  <strong>Score de confiance</strong><br/>
                  Basé sur : taille segment ({confidence >= 40 ? '✓' : '✗'}), 
                  carburant ({vehicle.carburant !== 'autre' ? '✓' : '✗'}), 
                  transmission ({vehicle.transmission !== 'autre' ? '✓' : '✗'}), 
                  puissance ({(vehicle.puissance || 0) > 0 ? '✓' : '✗'})
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight min-h-[2.5rem]">
          {vehicle.titre}
        </h4>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{vehicle.annee}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <span>{vehicle.kilometrage.toLocaleString('fr-FR')} km</span>
          </div>
          {vehicle.carburant && vehicle.carburant !== 'autre' && (
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              <span>{CARBURANT_LABELS[vehicle.carburant]}</span>
            </div>
          )}
          {vehicle.transmission && vehicle.transmission !== 'autre' && (
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>{TRANSMISSION_LABELS[vehicle.transmission]}</span>
            </div>
          )}
          {vehicle.puissance && vehicle.puissance > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>{vehicle.puissance} cv</span>
            </div>
          )}
        </div>

        {/* Km delta indicator */}
        {vehicle.ecartKm !== undefined && vehicle.ecartKm !== 0 && (
          <div className="text-xs">
            <span className={vehicle.ecartKm < 0 ? 'text-success' : 'text-destructive'}>
              {vehicle.ecartKm > 0 ? '+' : ''}{(vehicle.ecartKm / 1000).toFixed(0)}k km vs marché
            </span>
          </div>
        )}

        <div className="flex items-end justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-2xl font-bold font-mono text-foreground">
              {formatCurrency(vehicle.prix)}
            </p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {vehicle.prixAjuste && vehicle.prixAjuste !== vehicle.prixMoyen && (
                <p>Ajusté km: {formatCurrency(vehicle.prixAjuste)}</p>
              )}
              {vehicle.prixMoyen && (
                <p>Médiane: {formatCurrency(vehicle.prixMoyen)}</p>
              )}
            </div>
          </div>

          <Button
            variant="gold"
            size="sm"
            asChild
          >
            <a href={vehicle.lien} target="_blank" rel="noopener noreferrer">
              Voir
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
