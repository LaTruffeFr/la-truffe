import { VehicleWithScore } from '@/lib/csvParser';
import { TrendingDown, Target, Award, Calculator } from 'lucide-react';

interface SniperKPIsProps {
  avgPrice: number;
  decotePer10k: number;
  bestOffer: VehicleWithScore | null;
  totalVehicles: number;
  opportunitiesCount: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function SniperKPIs({ avgPrice, decotePer10k, bestOffer, totalVehicles, opportunitiesCount }: SniperKPIsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 border-b border-border">
      {/* Prix Moyen du Marché */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix Moyen Marché</p>
          <p className="text-2xl font-bold font-mono text-foreground">
            {formatCurrency(avgPrice)}
          </p>
          <p className="text-xs text-muted-foreground">{totalVehicles} véhicules analysés</p>
        </div>
      </div>

      {/* Décote par 10 000 km */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Décote / 10 000 km</p>
          <p className="text-2xl font-bold font-mono text-destructive">
            {formatCurrency(decotePer10k)}
          </p>
          <p className="text-xs text-muted-foreground">Pente de la courbe</p>
        </div>
      </div>

      {/* Opportunités */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
          <Target className="w-6 h-6 text-success" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Opportunités</p>
          <p className="text-2xl font-bold font-mono text-success">
            {opportunitiesCount}
          </p>
          <p className="text-xs text-muted-foreground">Sous la courbe</p>
        </div>
      </div>

      {/* Meilleure Offre */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-success/30 ring-1 ring-success/20">
        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
          <Award className="w-6 h-6 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Meilleure Offre</p>
          {bestOffer ? (
            <>
              <p className="text-xl font-bold font-mono text-success">
                {formatCurrency(bestOffer.prix)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {bestOffer.annee} • {bestOffer.kilometrage.toLocaleString()} km
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune</p>
          )}
        </div>
      </div>
    </div>
  );
}
