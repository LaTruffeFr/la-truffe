import { VehicleWithScore } from '@/lib/csvParser';
import { Car, ExternalLink, Award, BarChart3, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientOpportunityCardProps {
  vehicle: VehicleWithScore & {
    expectedPrice: number;
    deviation: number;
    deviationPercent: number;
  };
  rank: number;
  onAnalyze?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanModelName(model: string): string {
  const corrections: Record<string, string> = {
    'GOLE': 'Golf',
    'GOLFE': 'Golf',
    'GOF': 'Golf',
  };
  const upper = model.toUpperCase().trim();
  return corrections[upper] || model;
}

function calculateDealScore(deviationPercent: number): number {
  const score = Math.min(10, 5 + (deviationPercent / 3));
  return Math.round(score * 10) / 10;
}

function getEtatColor(etat: string): string {
  switch (etat) {
    case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'Très bon': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'Bon': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'Moyen': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'À vérifier': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-muted-foreground bg-muted border-border';
  }
}

export function ClientOpportunityCard({ vehicle, rank, onAnalyze }: ClientOpportunityCardProps) {
  const dealScore = calculateDealScore(vehicle.deviationPercent);
  const hasImage = vehicle.image && vehicle.image.length > 10;
  const ai = vehicle.aiAnalysis;

  return (
    <div className="relative glass-card overflow-hidden group hover:border-success/50 transition-all duration-300">
      {/* Rank badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
          #{rank}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {hasImage ? (
            <img
              src={vehicle.image}
              alt={`${vehicle.marque} ${vehicle.modele}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${hasImage ? 'hidden' : ''}`}>
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold text-foreground truncate">
            {cleanModelName(vehicle.modele)} {vehicle.annee}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {vehicle.marque} • {vehicle.kilometrage.toLocaleString('fr-FR')} km
          </p>

          {/* Prices */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prix Marché :</span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(vehicle.expectedPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prix Annonce :</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(vehicle.prix)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Score & Badge */}
        <div className="flex flex-col items-end justify-between">
          {/* Deal Score */}
          <div className="text-center">
            <div className="flex items-center gap-1 text-gold mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">SCORE LA TRUFFE</span>
            </div>
            <div className="text-2xl font-bold text-gold">
              {dealScore}<span className="text-sm font-normal">/10</span>
            </div>
          </div>

          {/* Savings Badge */}
          <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">
            Économie : {formatCurrency(vehicle.deviation)}
          </Badge>
        </div>
      </div>

      {/* AI Analysis Section */}
      {ai && (
        <div className="mx-4 mb-3 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Analyse IA</span>
            {ai.etat && (
              <Badge variant="outline" className={`text-xs ${getEtatColor(ai.etat)}`}>
                {ai.etat}
              </Badge>
            )}
          </div>
          
          {/* Resume */}
          {ai.resumeClient && (
            <p className="text-sm text-foreground/80 leading-relaxed">{ai.resumeClient}</p>
          )}

          {/* Points forts / faibles */}
          <div className="flex flex-wrap gap-3 mt-2">
            {ai.pointsForts.length > 0 && (
              <div className="flex-1 min-w-[140px]">
                {ai.pointsForts.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-green-700 mb-0.5">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            {ai.pointsFaibles.length > 0 && (
              <div className="flex-1 min-w-[140px]">
                {ai.pointsFaibles.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 mb-0.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          {ai.options.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {ai.options.map((opt, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {onAnalyze && (
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onAnalyze}
          >
            <BarChart3 className="w-4 h-4" />
            Analyser
          </Button>
        )}
        {vehicle.lien ? (
          <Button
            variant="gold"
            className={`gap-2 ${onAnalyze ? 'flex-1' : 'w-full'}`}
            onClick={() => window.open(vehicle.lien, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Voir l'annonce
          </Button>
        ) : (
          <Button variant="secondary" className={onAnalyze ? 'flex-1' : 'w-full'} disabled>
            Lien non disponible
          </Button>
        )}
      </div>
    </div>
  );
}
