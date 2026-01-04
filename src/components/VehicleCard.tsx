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
        glass-card overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300
        animate-fade-in ${isOpportunity ? 'ring-1 ring-success/30 success-glow' : ''}
      `}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {/* Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.titre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1d24" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No Image</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground text-sm">Pas d'image</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Gain Badge */}
        <div
          className={`
            absolute top-3 right-3 px-3 py-1.5 rounded-full font-mono font-bold text-sm
            transition-transform duration-300 group-hover:scale-105
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
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm">
          <span className="text-xs font-semibold text-foreground">{vehicle.marque}</span>
        </div>

        {/* Confidence indicator with tooltip */}
        {confidence > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm cursor-help">
                  <Shield className={`w-3.5 h-3.5 ${confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium">{confidence}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs leading-relaxed">
                  <strong className="block mb-1">Score de confiance</strong>
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
        <h4 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
          {vehicle.titre}
        </h4>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
            <Calendar className="w-3.5 h-3.5" />
            <span>{vehicle.annee}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
            <Gauge className="w-3.5 h-3.5" />
            <span>{vehicle.kilometrage.toLocaleString('fr-FR')} km</span>
          </div>
          {vehicle.carburant && vehicle.carburant !== 'autre' && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
              <Fuel className="w-3.5 h-3.5" />
              <span>{CARBURANT_LABELS[vehicle.carburant]}</span>
            </div>
          )}
          {vehicle.transmission && vehicle.transmission !== 'autre' && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
              <Settings className="w-3.5 h-3.5" />
              <span>{TRANSMISSION_LABELS[vehicle.transmission]}</span>
            </div>
          )}
          {vehicle.puissance && vehicle.puissance > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
              <Zap className="w-3.5 h-3.5" />
              <span>{vehicle.puissance} cv</span>
            </div>
          )}
        </div>

        {/* Km delta indicator */}
        {vehicle.ecartKm !== undefined && vehicle.ecartKm !== 0 && (
          <div className="text-xs">
            <span className={`inline-flex items-center gap-1 ${vehicle.ecartKm < 0 ? 'text-success' : 'text-destructive'}`}>
              {vehicle.ecartKm > 0 ? '+' : ''}{(vehicle.ecartKm / 1000).toFixed(0)}k km vs marché
            </span>
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t border-border/50">
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
            className="group-hover:scale-105 transition-transform"
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
