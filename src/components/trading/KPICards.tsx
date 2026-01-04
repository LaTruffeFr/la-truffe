import { VehicleWithScore } from '@/lib/csvParser';
import { TrendingUp, Target, BarChart3, Sparkles, Database } from 'lucide-react';

interface KPICardsProps {
  kpis: {
    totalAnalyzed: number;
    filteredCount: number;
    opportunitiesCount: number;
    reliableOpportunities: number; // With enough data
    bestDeal?: VehicleWithScore;
    avgDiscount: number;
    avgSavingsEuros: number;
    clustersCount: number;
    reliableClusters: number;
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
    <div className="grid grid-cols-5 gap-3 p-4 border-b border-border bg-card/30">
      {/* Vehicles Analyzed */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Véhicules</p>
            <p className="text-xl font-bold font-mono text-foreground">
              {kpis.totalAnalyzed.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Clusters */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <Database className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Clusters</p>
            <p className="text-xl font-bold font-mono text-foreground">
              {kpis.reliableClusters}
              <span className="text-xs text-muted-foreground ml-1">/ {kpis.clustersCount}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="glass-card p-3 ring-1 ring-success/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Opportunités</p>
            <p className="text-xl font-bold font-mono text-success">
              {kpis.reliableOpportunities}
              <span className="text-xs text-muted-foreground ml-1">fiables</span>
            </p>
          </div>
        </div>
      </div>

      {/* Average Savings */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Économie Moy.</p>
            <p className="text-xl font-bold font-mono text-primary">
              {formatCurrency(kpis.avgSavingsEuros)}
            </p>
            <p className="text-xs text-muted-foreground">
              ({kpis.avgDiscount > 0 ? '+' : ''}{kpis.avgDiscount}%)
            </p>
          </div>
        </div>
      </div>

      {/* Best Deal */}
      <div className="glass-card p-3 gold-glow ring-1 ring-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
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
                  <span className="text-xs text-success ml-1">
                    +{kpis.bestDeal.ecartEuros.toLocaleString('fr-FR')}€
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
