import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProFlippingModal } from './ProFlippingModal';

interface VehicleCard {
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

const DEMO_DATA: Record<string, VehicleCard[]> = {
  'Pistes à creuser': [
    { id: '1', photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300&h=200&fit=crop', marque: 'BMW', modele: 'Série 3 320d', annee: 2019, km: 87000, coteTruffe: 22500, fraisEstimes: 800 },
    { id: '2', photo: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=300&h=200&fit=crop', marque: 'Audi', modele: 'A4 Avant 2.0 TDI', annee: 2020, km: 65000, coteTruffe: 26800, fraisEstimes: 400 },
  ],
  'En Négociation': [
    { id: '3', photo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&h=200&fit=crop', marque: 'Mercedes', modele: 'Classe C 200', annee: 2018, km: 95000, coteTruffe: 24200, prixAchat: 19500, fraisEstimes: 1200 },
  ],
  'Véhicule Acheté': [
    { id: '4', photo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=300&h=200&fit=crop', marque: 'Volkswagen', modele: 'Golf 8 GTI', annee: 2021, km: 42000, coteTruffe: 31500, prixAchat: 26000, fraisEstimes: 600 },
  ],
  'En Préparation': [
    { id: '5', photo: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=300&h=200&fit=crop', marque: 'Peugeot', modele: '3008 GT', annee: 2020, km: 55000, coteTruffe: 27000, prixAchat: 21000, fraisEstimes: 1800 },
  ],
  'Prêt à la Vente': [
    { id: '6', photo: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=300&h=200&fit=crop', marque: 'Renault', modele: 'Mégane RS', annee: 2019, km: 38000, coteTruffe: 29800, prixAchat: 23000, fraisEstimes: 500 },
  ],
};

const COLUMN_COLORS: Record<string, string> = {
  'Pistes à creuser': 'border-t-blue-500',
  'En Négociation': 'border-t-amber-500',
  'Véhicule Acheté': 'border-t-emerald-500',
  'En Préparation': 'border-t-violet-500',
  'Prêt à la Vente': 'border-t-rose-500',
};

const COLUMN_BADGES: Record<string, string> = {
  'Pistes à creuser': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'En Négociation': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Véhicule Acheté': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'En Préparation': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Prêt à la Vente': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function ProKanbanBoard() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCard | null>(null);
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Rechercher un véhicule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Filter className="w-4 h-4 mr-2" /> Filtrer
          </Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un véhicule
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
        {Object.entries(DEMO_DATA).map(([column, vehicles]) => (
          <div key={column} className="min-w-[280px] md:min-w-[300px] flex-shrink-0 snap-start">
            <Card className={`bg-slate-900/50 border-slate-800 border-t-4 ${COLUMN_COLORS[column]} rounded-2xl p-0 overflow-hidden`}>
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <h3 className="text-sm font-semibold text-white">{column}</h3>
                <Badge variant="outline" className={`text-xs font-mono ${COLUMN_BADGES[column]}`}>
                  {vehicles.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-3 p-3 pt-0 min-h-[200px]">
                {vehicles
                  .filter(v => !search || `${v.marque} ${v.modele}`.toLowerCase().includes(search.toLowerCase()))
                  .map((vehicle) => {
                    const marge = vehicle.prixAchat
                      ? vehicle.coteTruffe - vehicle.prixAchat - (vehicle.fraisEstimes || 0)
                      : null;

                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="w-full text-left group"
                      >
                        <Card className="bg-slate-800/80 hover:bg-slate-800 border-slate-700/50 hover:border-amber-500/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5">
                          <img
                            src={vehicle.photo}
                            alt={`${vehicle.marque} ${vehicle.modele}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3 space-y-2">
                            <div>
                              <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                                {vehicle.marque} {vehicle.modele}
                              </p>
                              <p className="text-xs text-slate-400">
                                {vehicle.annee} · {vehicle.km.toLocaleString('fr-FR')} km
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-400 font-bold text-sm">
                                {vehicle.coteTruffe.toLocaleString('fr-FR')} €
                              </span>
                              {marge !== null && (
                                <Badge className={`text-[10px] px-1.5 py-0 ${marge > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                  {marge > 0 ? '+' : ''}{marge.toLocaleString('fr-FR')} €
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      </button>
                    );
                  })}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Flipping Modal */}
      {selectedVehicle && (
        <ProFlippingModal
          vehicle={selectedVehicle}
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
