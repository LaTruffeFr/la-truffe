import { AlertCircle } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border">
      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="disclaimer-text">
        L'analyse porte uniquement sur le positionnement prix. Vérifiez toujours l'historique 
        administratif et l'état mécanique du véhicule avant achat.
      </p>
    </div>
  );
}
