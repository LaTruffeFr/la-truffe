import { VehicleWithScore } from '@/lib/csvParser';
import { TrendingUp, Target, BarChart3, Sparkles } from 'lucide-react';

interface KPICardsProps {
  kpis: {
    totalAnalyzed: number;
    filteredCount: number;
    opportunitiesCount: number;
    bestDeal?: VehicleWithScore;
    avgDiscount: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-border bg-card/30">
      {/* Vehicles Analyzed */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Véhicules</p>
            <p className="text-2xl font-bold font-mono text-foreground">
              {kpis.totalAnalyzed.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="glass-card p-4 ring-1 ring-success/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Opportunités</p>
            <p className="text-2xl font-bold font-mono text-success">
              {kpis.opportunitiesCount.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Average Discount */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Écart Moyen</p>
            <p className="text-2xl font-bold font-mono text-primary">
              -{kpis.avgDiscount}%
            </p>
          </div>
        </div>
      </div>

      {/* Best Deal */}
      <div className="glass-card p-4 gold-glow ring-1 ring-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Best Deal</p>
            {kpis.bestDeal ? (
              <div>
                <p className="text-sm font-semibold text-foreground truncate">
                  {kpis.bestDeal.marque} {kpis.bestDeal.modele}
                </p>
                <p className="text-lg font-bold font-mono text-primary">
                  {formatCurrency(kpis.bestDeal.prix)}
                  <span className="text-xs text-success ml-2">
                    {kpis.bestDeal.ecartPourcent}%
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-lg font-mono text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
