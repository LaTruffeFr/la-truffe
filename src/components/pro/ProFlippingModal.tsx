import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calculator, Rocket, AlertTriangle } from 'lucide-react';

interface Vehicle {
  id: string;
  photo: string;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  coteTruffe: number;
  prixAchat?: number;
  fraisEstimes?: number;
}

interface ProFlippingModalProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
}

export function ProFlippingModal({ vehicle, open, onClose }: ProFlippingModalProps) {
  const [prixAchat, setPrixAchat] = useState(vehicle.prixAchat?.toString() || '');
  const [frais, setFrais] = useState(vehicle.fraisEstimes?.toString() || '');

  useEffect(() => {
    setPrixAchat(vehicle.prixAchat?.toString() || '');
    setFrais(vehicle.fraisEstimes?.toString() || '');
  }, [vehicle]);

  const achat = parseInt(prixAchat) || 0;
  const fraisNum = parseInt(frais) || 0;
  const marge = vehicle.coteTruffe - achat - fraisNum;
  const margePercent = achat > 0 ? ((marge / achat) * 100) : 0;
  const isExcellent = margePercent > 15;
  const isGood = margePercent > 5 && margePercent <= 15;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            Simulateur de Rentabilité
          </DialogTitle>
        </DialogHeader>

        {/* Vehicle Info */}
        <div className="flex gap-4 items-start">
          <img
            src={vehicle.photo}
            alt={`${vehicle.marque} ${vehicle.modele}`}
            className="w-28 h-20 object-cover rounded-xl border border-slate-700"
          />
          <div>
            <h3 className="font-bold text-lg text-white">{vehicle.marque} {vehicle.modele}</h3>
            <p className="text-sm text-slate-400">{vehicle.annee} · {vehicle.km.toLocaleString('fr-FR')} km</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Cote La Truffe :</span>
              <span className="font-bold text-amber-400">{vehicle.coteTruffe.toLocaleString('fr-FR')} €</span>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <Card className="bg-slate-900 border-slate-800 p-6 rounded-2xl space-y-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Prix d'achat négocié (€)</Label>
              <Input
                type="number"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
                placeholder="Ex: 19 500"
                className="bg-slate-800 border-slate-700 text-white text-lg h-12 font-mono placeholder:text-slate-600 focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Frais de remise en état (€)
                {vehicle.fraisEstimes && (
                  <span className="text-amber-500/60 ml-1 text-xs">pré-estimé</span>
                )}
              </Label>
              <Input
                type="number"
                value={frais}
                onChange={(e) => setFrais(e.target.value)}
                placeholder="Ex: 1 200"
                className="bg-slate-800 border-slate-700 text-white text-lg h-12 font-mono placeholder:text-slate-600 focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Breakdown */}
          {achat > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Cote de revente estimée</span>
                <span className="text-white font-mono">{vehicle.coteTruffe.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>− Prix d'achat</span>
                <span className="text-white font-mono">−{achat.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>− Frais de remise en état</span>
                <span className="text-white font-mono">−{fraisNum.toLocaleString('fr-FR')} €</span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

              {/* Result */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">Marge Nette Projetée</span>
                <div className="flex items-center gap-2">
                  {marge >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-2xl font-bold font-mono ${marge >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marge >= 0 ? '+' : ''}{marge.toLocaleString('fr-FR')} €
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <span className={`text-sm font-mono ${marge >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                  ({margePercent >= 0 ? '+' : ''}{margePercent.toFixed(1)}%)
                </span>
              </div>

              {/* Status Badge */}
              {isExcellent && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-2">
                  <Rocket className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-400 text-lg">🚀 Excellente Affaire</p>
                    <p className="text-emerald-400/70 text-sm">Marge supérieure à 15% — Feu vert pour l'achat !</p>
                  </div>
                </div>
              )}
              {isGood && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-2">
                  <TrendingUp className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-400">Affaire correcte</p>
                    <p className="text-amber-400/70 text-sm">Marge modérée — Négociez encore si possible.</p>
                  </div>
                </div>
              )}
              {!isExcellent && !isGood && achat > 0 && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-2">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-400">Marge insuffisante</p>
                    <p className="text-red-400/70 text-sm">Renégociez le prix ou les frais avant de vous engager.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
