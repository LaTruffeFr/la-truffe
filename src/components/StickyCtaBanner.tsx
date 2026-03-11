import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StickyCtaBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] print:hidden">
      <div className="relative mx-auto max-w-5xl px-3 pb-3 md:px-6 md:pb-4">
        <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/70 px-4 py-3 shadow-2xl backdrop-blur-xl md:gap-5 md:px-6 md:py-4 dark:bg-card/60">
          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-md transition-colors hover:bg-destructive hover:text-destructive-foreground md:h-7 md:w-7"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Icon + Text */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden shrink-0 items-center justify-center rounded-xl bg-primary/10 p-2.5 sm:flex">
              <ScanSearch className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold leading-tight text-foreground sm:text-sm md:text-base">
              Vous achetez une voiture ?{' '}
              <span className="text-muted-foreground">Analysez votre annonce Leboncoin.</span>
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate('/')}
            size="sm"
            className="shrink-0 rounded-xl font-bold shadow-lg shadow-primary/20 md:px-6 md:text-sm"
          >
            <span className="hidden sm:inline">Tester La Truffe</span>
            <span className="sm:hidden">Tester</span>
            <span className="ml-1">➔</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
