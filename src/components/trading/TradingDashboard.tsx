import React, { useMemo } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Target, Car, Filter, ExternalLink } from 'lucide-react';

interface Vehicle {
  id: string;
  titre: string;
  prix: number;
  kilometrage: number;
  annee: number;
  image: string;
  lien: string;
  dealScore: number;
  ecartEuros: number;
}

interface MarketStats {
  averagePrice: number;
  vehicleCount: number;
  lowestPrice: number;
  highestPrice: number;
  brand: string;
  model: string;
}

interface TradingDashboardProps {
  data: Vehicle[];
  marketStats: MarketStats;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
        <p className="font-bold mb-1">{data.titre}</p>
        <p className="text-emerald-400 font-mono">{data.prix.toLocaleString()} €</p>
        <p className="text-slate-400">{data.kilometrage.toLocaleString()} km</p>
        <p className="mt-1 font-semibold">Score: {data.dealScore}/100</p>
      </div>
    );
  }
  return null;
};

const TradingDashboard: React.FC<TradingDashboardProps> = ({ data, marketStats }) => {
  
  // Trier les véhicules par "Deal Score" pour le top 5
  const topDeals = useMemo(() => {
    return [...data].sort((a, b) => b.dealScore - a.dealScore).slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-8">
      
      {/* --- GRAPHIQUE SNIPER (SCATTER PLOT) --- */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> 
              Matrice de marché "Sniper"
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div> Bonne affaire
              </Badge>
              <Badge variant="outline" className="bg-slate-50 text-slate-600">
                <div className="w-2 h-2 rounded-full bg-slate-400 mr-1"></div> Prix marché
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="kilometrage" 
                name="Kilométrage" 
                unit=" km" 
                reversed={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                label={{ value: 'Kilométrage', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="prix" 
                name="Prix" 
                unit=" €" 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              
              {/* Ligne de tendance moyenne (Approx) */}
              <ReferenceLine y={marketStats.averagePrice} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: 'Moyenne', fill: '#94a3b8', fontSize: 10 }} />

              <Scatter name="Véhicules" data={data} fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.dealScore > 80 ? '#22c55e' : entry.dealScore > 50 ? '#3b82f6' : '#ef4444'} 
                    stroke="white"
                    strokeWidth={2}
                    r={entry.dealScore > 80 ? 8 : 5} // Les bonnes affaires sont plus grosses
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* --- LISTE DES TOP OPPORTUNITÉS --- */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-green-600" />
          Top 5 Opportunités identifiées
        </h3>
        
        <div className="grid gap-4">
          {topDeals.map((vehicule) => (
            <Card key={vehicule.id} className="group overflow-hidden border-slate-200 hover:border-primary/50 transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-slate-100">
                  <img 
                    src={vehicule.image} 
                    alt={vehicule.titre} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image' }}
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    Score {vehicule.dealScore}
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">
                        {vehicule.titre}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <Car className="w-4 h-4" /> {vehicule.annee} • {vehicule.kilometrage.toLocaleString()} km
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{vehicule.prix.toLocaleString()} €</div>
                      {vehicule.ecartEuros > 0 && (
                        <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block mt-1">
                          -{vehicule.ecartEuros.toLocaleString()} € sous la cote
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded">Garantie 12 mois</span>
                      <span className="bg-slate-100 px-2 py-1 rounded">Première main</span>
                    </div>
                    <Button size="sm" className="gap-2" asChild>
                      <a href={vehicule.lien} target="_blank" rel="noopener noreferrer">
                        Voir l'annonce <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;