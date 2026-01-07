import { TrendingDown, Target, Trophy, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Demo data for the landing page simulator
const DEMO_DATA = {
  avgMarketPrice: 18500,
  laTruffePrice: 14200,
  vehicleCount: 127,
  topCount: 5,
};

export function DemoSavingsSimulator() {
  const navigate = useNavigate();
  
  const savings = DEMO_DATA.avgMarketPrice - DEMO_DATA.laTruffePrice;
  const savingsPercent = Math.round((savings / DEMO_DATA.avgMarketPrice) * 100);
  const monthsOfSalary = Math.round(savings / 1400 * 10) / 10;
  const laTruffePercent = (DEMO_DATA.laTruffePrice / DEMO_DATA.avgMarketPrice) * 100;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/30 p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          Exemple : Volkswagen Golf 7
        </span>
        <h2 className="text-xl font-bold text-foreground tracking-wide">
          🎯 SIMULATEUR D'ÉCONOMIES
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Voyez combien vous pouvez économiser
        </p>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {DEMO_DATA.avgMarketPrice.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">
              Basé sur {DEMO_DATA.vehicleCount} annonces
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
              {DEMO_DATA.laTruffePrice.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground">
              Top {DEMO_DATA.topCount} meilleures offres
            </p>
          </div>
        </div>

        {/* Card 3: Gain Immédiat */}
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
          <span>{DEMO_DATA.avgMarketPrice.toLocaleString('fr-FR')} €</span>
        </div>
        <div className="relative h-8 rounded-full bg-muted/50 overflow-hidden border border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/40 to-destructive/60" />
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-success to-success/80 transition-all duration-1000 ease-out"
            style={{ width: `${laTruffePercent}%` }}
          />
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

      {/* CTA - Blurred deals preview */}
      <div className="relative rounded-xl border border-border bg-card/50 p-6 overflow-hidden">
        {/* Blurred background */}
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10 flex flex-col items-center justify-center gap-4">
          <Lock className="w-10 h-10 text-muted-foreground" />
          <p className="text-center text-muted-foreground max-w-sm">
            Créez votre compte pour accéder aux meilleures annonces détectées par notre algorithme
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="gap-2"
          >
            Créer mon compte gratuitement
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Fake blurred content behind */}
        <div className="blur-sm pointer-events-none opacity-50">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-16 h-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="text-right">
                  <div className="h-5 bg-success/30 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
