import { VehicleWithScore } from '@/lib/csvParser';
import { TrendingDown, Target, Trophy, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavingsSimulatorProps {
  vehicles: VehicleWithScore[];
  onScrollToDeals: () => void;
}

export function SavingsSimulator({ vehicles, onScrollToDeals }: SavingsSimulatorProps) {
  // Calculate average market price (all vehicles)
  const avgMarketPrice = vehicles.length > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + v.prix, 0) / vehicles.length)
    : 0;

  // Get top 5 green opportunities (lowest dealScore = best deals, negative values)
  const topOpportunities = [...vehicles]
    .filter(v => v.dealScore < 0) // Only green/good deals
    .sort((a, b) => a.dealScore - b.dealScore)
    .slice(0, 5);

  // Calculate La Truffe price (average of top 5 opportunities)
  const laTruffePrice = topOpportunities.length > 0
    ? Math.round(topOpportunities.reduce((sum, v) => sum + v.prix, 0) / topOpportunities.length)
    : avgMarketPrice;

  // Calculate savings
  const savings = avgMarketPrice - laTruffePrice;
  const savingsPercent = avgMarketPrice > 0 ? Math.round((savings / avgMarketPrice) * 100) : 0;

  // Approximate salary comparison (SMIC ~1400€)
  const monthsOfSalary = Math.round(savings / 1400 * 10) / 10;

  // Gauge proportions
  const gaugeTotal = avgMarketPrice;
  const laTruffePercent = avgMarketPrice > 0 ? (laTruffePrice / gaugeTotal) * 100 : 0;
  const savingsGaugePercent = 100 - laTruffePercent;

  if (vehicles.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground tracking-wide">
          🎯 SIMULATEUR D'ÉCONOMIES
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Comparatif instantané vs le marché
        </p>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Prix Moyen Leboncoin */}
        <div className="relative overflow-hidden rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-5">
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-destructive/70 font-medium">
              Prix Moyen Leboncoin
            </p>
            <p className="text-3xl font-bold text-destructive line-through decoration-2">
              {avgMarketPrice.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">
              Basé sur {vehicles.length} annonces
            </p>
          </div>
        </div>

        {/* Card 2: Prix La Truffe */}
        <div className="relative overflow-hidden rounded-xl border border-success/50 bg-gradient-to-br from-success/20 to-success/10 p-5 shadow-[0_0_30px_-5px_hsl(var(--success)/0.3)]">
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-success/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-success" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-success font-medium">
              Prix La Truffe
            </p>
            <p className="text-3xl font-bold text-success">
              {laTruffePrice.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">
              Top {topOpportunities.length} meilleures offres
            </p>
          </div>
        </div>

        {/* Card 3: Gain Immédiat - The biggest one */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 p-5 shadow-[0_0_40px_-5px_hsl(var(--primary)/0.4)]">
          <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center animate-pulse">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-primary font-bold">
              🏆 Votre Gain Immédiat
            </p>
            <p className="text-4xl font-black text-primary">
              {savings.toLocaleString('fr-FR')} €
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                Soit <span className="text-primary font-bold">{savingsPercent}%</span> d'économie
              </p>
              <p className="text-xs text-muted-foreground">
                ≈ {monthsOfSalary} mois de salaire économisés
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Gauge Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 €</span>
          <span>{avgMarketPrice.toLocaleString('fr-FR')} €</span>
        </div>
        <div className="relative h-8 rounded-full bg-muted/50 overflow-hidden border border-border">
          {/* Market price (full bar - red/grey) */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-destructive/40 to-destructive/60"
          />
          
          {/* La Truffe price (green portion) */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-success to-success/80 transition-all duration-1000 ease-out"
            style={{ width: `${laTruffePercent}%` }}
          />
          
          {/* Savings zone indicator */}
          <div 
            className="absolute top-0 bottom-0 flex items-center justify-center"
            style={{ left: `${laTruffePercent}%`, right: '0' }}
          >
            <div className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/50 shadow-lg">
              <span className="text-xs font-bold text-primary-foreground whitespace-nowrap">
                -{savings.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-gradient-to-r from-success to-success/80" />
            <span className="text-muted-foreground">Prix La Truffe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-gradient-to-r from-destructive/40 to-destructive/60" />
            <span className="text-muted-foreground">Surcoût marché</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex justify-center pt-2">
        <Button 
          onClick={onScrollToDeals}
          size="xl"
          variant="gold"
          className="gap-3 text-lg font-bold shadow-xl hover:scale-105 transition-transform"
        >
          <ArrowDown className="w-5 h-5 animate-bounce" />
          ACCÉDER AUX {topOpportunities.length} ANNONCES À {laTruffePrice.toLocaleString('fr-FR')} €
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </Button>
      </div>
    </div>
  );
}
