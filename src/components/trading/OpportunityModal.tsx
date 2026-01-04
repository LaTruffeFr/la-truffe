import { VehicleWithScore } from '@/lib/csvParser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Copy, Printer, CheckCircle2, Calendar, Gauge, Fuel, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OpportunityModalProps {
  vehicle: VehicleWithScore & { expectedPrice?: number; deviation?: number; deviationPercent?: number };
  onClose: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

const CARBURANT_LABELS: Record<string, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  electrique: 'Électrique',
  hybride: 'Hybride',
  gpl: 'GPL',
  autre: 'Non précisé',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  automatique: 'Automatique',
  manuelle: 'Manuelle',
  autre: 'Non précisée',
};

export function OpportunityModal({ vehicle, onClose }: OpportunityModalProps) {
  const [copied, setCopied] = useState(false);
  
  const savings = vehicle.deviation || Math.abs(vehicle.ecartEuros);
  const savingsPercent = vehicle.deviationPercent || Math.abs(vehicle.ecartPourcent);
  const estimatedPrice = vehicle.expectedPrice || vehicle.coteCluster;

  const handleCopyLink = async () => {
    if (vehicle.lien) {
      await navigator.clipboard.writeText(vehicle.lien);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden print:max-w-full print:shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Opportunité - {vehicle.marque} {vehicle.modele}</DialogTitle>
        </DialogHeader>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-success/20 to-success/5 p-4 border-b border-success/30 print:bg-success/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Opportunité Détectée</p>
                <p className="text-xs text-muted-foreground">Sous le prix du marché</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors print:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vehicle Image */}
        <div className="relative h-56 bg-muted print:h-40">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.titre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-background">
              <span className="text-muted-foreground">Pas d'image disponible</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-6">
            <p className="text-sm text-muted-foreground">{vehicle.marque}</p>
            <h2 className="text-2xl font-bold text-foreground">{vehicle.modele}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Comparison - The Hero Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prix Affiché</p>
                <p className="text-3xl font-bold font-mono text-foreground">
                  {formatCurrency(vehicle.prix)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prix Estimé Marché</p>
                <p className="text-3xl font-bold font-mono text-muted-foreground line-through decoration-destructive/50">
                  {formatCurrency(estimatedPrice)}
                </p>
              </div>
            </div>

            {/* Savings Highlight */}
            <div className="p-5 rounded-xl bg-success/10 border border-success/30 text-center">
              <p className="text-sm text-success font-medium mb-1">Économie Réalisée</p>
              <div className="flex items-center justify-center gap-4">
                <p className="text-4xl font-bold font-mono text-success">
                  {formatCurrency(savings)}
                </p>
                <span className="px-3 py-1 rounded-full bg-success text-success-foreground text-sm font-bold">
                  -{savingsPercent}%
                </span>
              </div>
              <p className="text-xs text-success/80 mt-2">Gain immédiat vs. prix du marché</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 text-center">
              <Calendar className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Année</p>
              <p className="font-bold text-sm">{vehicle.annee}</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 text-center">
              <Gauge className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Km</p>
              <p className="font-bold text-sm">{(vehicle.kilometrage / 1000).toFixed(0)}k</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 text-center">
              <Fuel className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Carburant</p>
              <p className="font-bold text-sm">{CARBURANT_LABELS[vehicle.carburant]?.slice(0, 7) || '-'}</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 text-center">
              <Settings className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Boîte</p>
              <p className="font-bold text-sm">{TRANSMISSION_LABELS[vehicle.transmission]?.slice(0, 5) || '-'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 print:hidden">
            <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
            <Button variant="gold" asChild className="flex-1 gap-2">
              <a href={vehicle.lien} target="_blank" rel="noopener noreferrer">
                Voir l'annonce
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground print:mt-8">
            Analyse réalisée par La Truffe • {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
