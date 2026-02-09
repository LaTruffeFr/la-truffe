import { useBetaSpots } from '@/hooks/useBetaSpots';
import { Progress } from '@/components/ui/progress';
import { Flame, Lock } from 'lucide-react';

export function BetaCounter() {
  const { spotsRemaining, maxSpots, isBetaFull, isLoading } = useBetaSpots();

  if (isLoading || spotsRemaining === null) return null;

  const taken = maxSpots - spotsRemaining;
  const percentTaken = Math.min(100, (taken / maxSpots) * 100);

  if (isBetaFull) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-700">
        <Lock className="w-4 h-4" />
        Bêta Complète — Accès Payant uniquement
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
        <span className="text-sm font-bold text-slate-700">
          Bêta Privée : Plus que <span className="text-primary text-base">{spotsRemaining}</span> place{spotsRemaining > 1 ? 's' : ''} sur {maxSpots}
        </span>
      </div>
      <Progress value={percentTaken} className="h-2.5 bg-slate-200" />
      <p className="text-xs text-slate-500 mt-1.5 text-center">
        🎁 1 analyse gratuite offerte aux {maxSpots} premiers inscrits
      </p>
    </div>
  );
}
