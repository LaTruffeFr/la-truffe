import { VehicleWithScore } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Calendar, Gauge, Fuel, Settings, Zap } from 'lucide-react';

interface DealCardProps {
  vehicle: VehicleWithScore;
  onClick?: () => void;
  rank?: number;
}

function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
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

export function DealCard({ vehicle, onClick, rank }: DealCardProps) {
  // SÉCURITÉ : On s'assure que toutes les valeurs existent
  const score = vehicle.dealScore || 0;
  const isGreatDeal = score >= 70;
  const isGoodDeal = score >= 50;
  const hasData = vehicle.hasEnoughData !== false;
  const savings = vehicle.ecartEuros || 0;
  const percent = vehicle.ecartPourcent || 0;
  const km = vehicle.kilometrage || 0;
  const price = vehicle.prix || 0;
  const cote = vehicle.coteCluster || 0;

  return (
    <div
      className={`
        h-full glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300 flex flex-col
        ${isGreatDeal && hasData ? 'ring-1 ring-success/40 success-glow' : ''}
      `}
    >
      {/* Image Agrandie (h-52) */}
      <div className="relative h-52 bg-muted overflow-hidden shrink-0">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.titre || "Véhicule"}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">Pas d'image</span>
          </div>
        )}

        {/* Deal Badge */}
        {hasData ? (
          <div
            className={`
              absolute top-3 right-3 px-3 py-1.5 rounded-full font-mono font-bold text-sm shadow-md backdrop-blur-md
              ${isGreatDeal
                ? 'bg-success/90 text-white'
                : isGoodDeal
                  ? 'bg-primary/90 text-white'
                  : 'bg-destructive/90 text-white'
              }
            `}
          >
            {savings > 0 ? '+' : ''}{savings.toLocaleString('fr-FR')} €
          </div>
        ) : (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-muted/90 text-muted-foreground text-xs shadow-sm backdrop-blur-md">
            Données limitées
          </div>
        )}

        {/* Brand Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1">
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-semibold text-white border border-white/10 shadow-sm">
            {vehicle.marque}
          </span>
          {vehicle.isPremium && (
            <span className="px-2 py-1 rounded bg-primary/90 backdrop-blur-sm text-xs font-semibold text-primary-foreground shadow-sm">
              Premium
            </span>
          )}
        </div>

        {/* Rank Badge */}
        {rank && (
          <div className="absolute bottom-3 left-3 bg-white text-black font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg text-sm border-2 border-white">
            #{rank}
          </div>
        )}
        
        {/* Score & Cluster (affichés discrètement) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
           <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md flex items-center gap-1 shadow-sm border border-white/10">
            <div className={`w-2 h-2 rounded-full ${hasData ? (isGreatDeal ? 'bg-success' : isGoodDeal ? 'bg-primary' : 'bg-destructive') : 'bg-muted-foreground'}`} />
            <span className="text-xs font-mono text-white">{score}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 space-y-4">
        <h4 className="font-bold text-foreground line-clamp-2 text-base leading-tight min-h-[2.5rem]">
          {vehicle.titre || "Véhicule sans titre"}
        </h4>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
            <Calendar className="w-3.5 h-3.5 text-primary/70" />
            <span>{vehicle.annee || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
            <Gauge className="w-3.5 h-3.5 text-primary/70" />
            <span>{km.toLocaleString('fr-FR')} km</span>
          </div>
          {vehicle.carburant && CARBURANT_LABELS[vehicle.carburant.toLowerCase()] && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <Fuel className="w-3.5 h-3.5 text-primary/70" />
              <span>{CARBURANT_LABELS[vehicle.carburant.toLowerCase()]}</span>
            </div>
          )}
          {vehicle.transmission && TRANSMISSION_LABELS[vehicle.transmission.toLowerCase()] && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <Settings className="w-3.5 h-3.5 text-primary/70" />
              <span>{TRANSMISSION_LABELS[vehicle.transmission.toLowerCase()]}</span>
            </div>
          )}
          {(vehicle.puissance || 0) > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
              <Zap className="w-3.5 h-3.5 text-primary/70" />
              <span>{vehicle.puissance} cv</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="pt-4 border-t border-border/50 flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(price)}
            </p>
            {hasData ? (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Cote: {formatCurrency(cote)}
                <span className={`ml-1.5 ${percent > 0 ? 'text-success' : 'text-destructive'}`}>
                  ({percent > 0 ? '+' : ''}{percent}%)
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-1">Données insuffisantes</p>
            )}
          </div>

          <div className="flex gap-2">
            {onClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="h-10 w-10 p-0 rounded-lg hover:bg-muted"
              >
                <FileText className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="default" // Utilisation de 'default' (souvent noir/primaire) au lieu de 'gold' si non défini
              size="sm"
              asChild
              className="h-10 px-5 rounded-lg font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href={vehicle.lien || '#'} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}