import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Copy, Printer, CheckCircle2, Calendar, Gauge, Fuel, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Interface souple pour accepter les données CSV ou DB
interface OpportunityModalProps {
  vehicle: any;
  onClose: () => void;
}

function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return "0 €";
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
  const { toast } = useToast();
  
  // Calculs sécurisés (Fallback si certaines données manquent)
  const savings = vehicle.deviation || vehicle.gain_potentiel || Math.abs(vehicle.ecartEuros || 0);
  const savingsPercent = vehicle.deviationPercent || Math.abs(vehicle.ecartPourcent || 0);
  // Prix estimé = Prix + Économie
  const estimatedPrice = vehicle.expectedPrice || vehicle.coteCluster || (vehicle.prix + savings);

  const handleCopyLink = async () => {
    const link = vehicle.lien || vehicle.link;
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: 'Lien copié !', description: "L'URL est dans le presse-papier." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden print:max-w-full print:shadow-none bg-white gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Opportunité - {vehicle.marque} {vehicle.modele}</DialogTitle>
        </DialogHeader>

        {/* Header Banner */}
        <div className="bg-emerald-50 p-4 border-b border-emerald-100 print:bg-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-700">Opportunité Détectée</p>
                <p className="text-xs text-emerald-600">Sous le prix du marché</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors print:hidden"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Vehicle Image */}
        <div className="relative h-64 bg-slate-100 print:h-48">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.titre}
              className="w-full h-full object-cover object-center"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://source.unsplash.com/1600x900/?car,${vehicle.marque}`; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <span className="text-slate-400">Pas d'image disponible</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 text-white pr-4">
            <p className="text-sm font-medium opacity-80">{vehicle.marque}</p>
            <h2 className="text-3xl font-bold">{vehicle.modele}</h2>
            <p className="text-sm opacity-80 line-clamp-1">{vehicle.titre}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Price Comparison - The Hero Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Prix Affiché</p>
                <p className="text-3xl font-bold font-mono text-slate-900">
                  {formatCurrency(vehicle.prix)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-dashed border-slate-300">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Prix Estimé Marché</p>
                <p className="text-3xl font-bold font-mono text-slate-400 line-through decoration-red-400/50">
                  {formatCurrency(estimatedPrice)}
                </p>
              </div>
            </div>

            {/* Savings Highlight */}
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm text-emerald-700 font-bold mb-1 uppercase tracking-wide">Économie Potentielle</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-4xl font-black font-mono text-emerald-600">
                    {formatCurrency(savings)}
                  </p>
                  {savingsPercent > 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-sm">
                      -{savingsPercent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-600 mt-2 font-medium">Gain immédiat par rapport à la cote</p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 text-center border border-slate-100">
              <Calendar className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Année</p>
              <p className="font-bold text-sm text-slate-700">{vehicle.annee}</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 text-center border border-slate-100">
              <Gauge className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Km</p>
              <p className="font-bold text-sm text-slate-700">{(vehicle.kilometrage / 1000).toFixed(0)}k</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 text-center border border-slate-100">
              <Fuel className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Énergie</p>
              <p className="font-bold text-sm text-slate-700 capitalize truncate w-full">
                {vehicle.carburant ? (CARBURANT_LABELS[vehicle.carburant.toLowerCase()] || vehicle.carburant) : '-'}
              </p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 text-center border border-slate-100">
              <Settings className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-[10px] uppercase font-bold text-slate-400">Boîte</p>
              <p className="font-bold text-sm text-slate-700 capitalize">
                {vehicle.transmission ? (TRANSMISSION_LABELS[vehicle.transmission.toLowerCase()] || vehicle.transmission) : '-'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 print:hidden">
            <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Lien'}
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
            <Button className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-white" asChild>
              <a href={vehicle.lien || vehicle.link} target="_blank" rel="noopener noreferrer">
                Voir l'annonce
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 print:mt-8">
            Analyse réalisée par La Truffe • {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}