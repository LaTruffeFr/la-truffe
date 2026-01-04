import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { Button } from "@/components/ui/button";

interface OpportunityBannerProps {
  bestDeal: Vehicle | null;
  onViewDeal?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function OpportunityBanner({ bestDeal, onViewDeal }: OpportunityBannerProps) {
  if (!bestDeal || !bestDeal.gainPotentiel || bestDeal.gainPotentiel < 1500) {
    return null;
  }

  return (
    <div className="glass-card overflow-hidden relative animate-fade-in">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-success/10 via-success/5 to-transparent" />
      
      {/* Animated sparkle effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl animate-pulse-slow" />
      
      <div className="relative p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/20 success-glow">
            <Sparkles className="w-6 h-6 text-success" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-success">Meilleure opportunité</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <h3 className="font-semibold text-foreground line-clamp-1 max-w-md">
              {bestDeal.marque} {bestDeal.modele}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(bestDeal.prix)} • {bestDeal.annee} • {bestDeal.kilometrage?.toLocaleString('fr-FR')} km
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Gain potentiel</p>
            <p className="text-2xl font-bold font-mono text-success">
              +{formatCurrency(bestDeal.gainPotentiel)}
            </p>
          </div>
          
          {bestDeal.lien && (
            <Button variant="gold" size="sm" asChild className="gap-2">
              <a href={bestDeal.lien} target="_blank" rel="noopener noreferrer">
                Voir
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
