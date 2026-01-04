import { VehicleWithScore } from '@/lib/csvParser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Calendar, Gauge, Fuel, Settings, Zap, MapPin, TrendingDown } from 'lucide-react';

interface ClientSheetModalProps {
  vehicle: VehicleWithScore;
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

export function ClientSheetModal({ vehicle, onClose }: ClientSheetModalProps) {
  const discount = Math.abs(vehicle.ecartPourcent);
  const savings = Math.abs(vehicle.ecart);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Fiche Client - {vehicle.marque} {vehicle.modele}</DialogTitle>
        </DialogHeader>

        {/* Header with image */}
        <div className="relative h-64 bg-muted">
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <p className="text-sm text-muted-foreground">{vehicle.marque}</p>
            <h2 className="text-2xl font-bold text-foreground">{vehicle.modele}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Deal highlight */}
          <div className="glass-card p-4 ring-1 ring-success/30 success-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Économie estimée</p>
                  <p className="text-2xl font-bold font-mono text-success">
                    -{discount}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Soit</p>
                <p className="text-xl font-bold font-mono text-success">
                  {formatCurrency(savings)}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prix affiché</p>
              <p className="text-3xl font-bold font-mono text-foreground">
                {formatCurrency(vehicle.prix)}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prix du marché</p>
              <p className="text-3xl font-bold font-mono text-muted-foreground line-through">
                {formatCurrency(vehicle.prixMoyen)}
              </p>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Année</p>
                <p className="font-semibold">{vehicle.annee}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Gauge className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kilométrage</p>
                <p className="font-semibold">{vehicle.kilometrage.toLocaleString('fr-FR')} km</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Fuel className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Carburant</p>
                <p className="font-semibold">{CARBURANT_LABELS[vehicle.carburant]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Boîte</p>
                <p className="font-semibold">{TRANSMISSION_LABELS[vehicle.transmission]}</p>
              </div>
            </div>
            {vehicle.puissance > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Puissance</p>
                  <p className="font-semibold">{vehicle.puissance} CV</p>
                </div>
              </div>
            )}
            {vehicle.localisation && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="font-semibold">{vehicle.localisation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            <Button variant="gold" asChild className="flex-1 gap-2">
              <a href={vehicle.lien} target="_blank" rel="noopener noreferrer">
                Voir l'annonce
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Score de confiance: {vehicle.dealScore}/100 • Analyse basée sur {vehicle.segmentKey.split('|')[0]} {vehicle.segmentKey.split('|')[1]}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
