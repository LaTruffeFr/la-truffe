import { useMemo } from 'react';
import { VehicleWithScore } from '@/lib/csvParser';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface SniperChartProps {
  data: VehicleWithScore[];
  onVehicleClick: (vehicle: VehicleWithScore) => void;
  trendLine: { type: string; a: number; b: number };
}

function formatPrice(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k€` : `${value}€`;
}

function formatKm(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

// Formule Logarithmique : Prix = a + b * ln(km)
function getExpectedPrice(km: number, a: number, b: number): number {
  if (km <= 0) return a; 
  return a + b * Math.log(km);
}

export function SniperChart({ data, onVehicleClick, trendLine }: SniperChartProps) {
  const { chartData, trendLineData, xDomain, yDomain } = useMemo(() => {
    if (data.length === 0) return { chartData: [], trendLineData: [], xDomain: [0, 100], yDomain: [0, 100] };

    const kms = data.map(v => v.kilometrage);
    const prices = data.map(v => v.prix);
    
    const minKm = Math.min(...kms);
    const maxKm = Math.max(...kms);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Marges dynamiques pour que le graph respire
    const kmPadding = (maxKm - minKm) * 0.1;
    const pricePadding = (maxPrice - minPrice) * 0.1;

    const xDomain = [Math.max(0, minKm - kmPadding), maxKm + kmPadding];
    const yDomain = [Math.max(0, minPrice - pricePadding), maxPrice + pricePadding];

    // --- GÉNÉRATION DE LA COURBE (20 points pour faire un arrondi propre) ---
    const trendLineData = [];
    const step = (xDomain[1] - xDomain[0]) / 20;
    for (let x = xDomain[0]; x <= xDomain[1]; x += step) {
      if (x > 100) { // On évite log(0)
        trendLineData.push({ km: x, trendPrice: getExpectedPrice(x, trendLine.a, trendLine.b) });
      }
    }

    // --- ANALYSE DES POINTS (Vert vs Noir) ---
    const chartData = data.map(v => {
      const expected = getExpectedPrice(v.kilometrage, trendLine.a, trendLine.b);
      const deviation = expected - v.prix;
      const deviationPercent = (deviation / expected) * 100;
      
      // LOGIQUE DE CLASSIFICATION
      const isGoodDeal = deviationPercent > 0; // Moins cher que la cote
      const isSuspicious = deviationPercent > 40; // 40% moins cher = SUSPECT (Arnaque ?)

      return {
        ...v,
        km: v.kilometrage,
        price: v.prix,
        expectedPrice: expected,
        isGoodDeal,
        isSuspicious,
        deviationPercent: Math.round(deviationPercent),
      };
    });

    return { chartData, trendLineData, xDomain, yDomain };
  }, [data, trendLine]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].payload;
    if (!v.marque) return null; // C'est un point de la ligne courbe

    return (
      <div className="bg-white p-4 shadow-xl rounded-xl border border-slate-200 z-50 min-w-[220px]">
        <p className="font-bold text-slate-900 mb-1">{v.titre}</p>
        <div className="text-xs text-slate-500 mb-3 flex gap-2">
          <span>{v.annee}</span> • <span>{v.kilometrage.toLocaleString()} km</span>
        </div>
        
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-600 text-sm">Prix :</span>
          <span className="font-bold text-lg">{v.prix.toLocaleString()} €</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
          <span>Cote estimée :</span>
          <span>{Math.round(v.expectedPrice).toLocaleString()} €</span>
        </div>

        {/* VERDICT DYNAMIQUE */}
        {v.isSuspicious ? (
          <div className="bg-black text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> DANGER (-{v.deviationPercent}%)
          </div>
        ) : v.isGoodDeal ? (
          <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold text-center text-sm">
            ✅ Bonne Affaire (-{v.deviationPercent}%)
          </div>
        ) : (
          <div className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-center text-sm">
            Prix Standard (+{Math.abs(v.deviationPercent)}%)
          </div>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          type="number" dataKey="km" domain={xDomain as any} 
          tickFormatter={formatKm} stroke="#94a3b8" 
          label={{ value: 'Kilométrage', position: 'bottom', offset: 0 }}
        />
        <YAxis 
          type="number" dataKey="price" domain={yDomain as any} 
          tickFormatter={formatPrice} stroke="#94a3b8" 
          label={{ value: 'Prix', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1 }} />
        
        {/* LA LIGNE DE TENDANCE COURBE */}
        <Line 
          data={trendLineData} type="monotone" dataKey="trendPrice" 
          stroke="#ef4444" strokeWidth={3} dot={false} 
          activeDot={false} 
        />

        {/* LES POINTS (Logique Couleur : Noir = Danger, Vert = Bon, Gris = Moyen) */}
        <Scatter data={chartData} onClick={(v) => v.isSuspicious ? null : onVehicleClick(v)}>
          {chartData.map((entry, index) => (
            <Cell 
              key={index} 
              fill={entry.isSuspicious ? '#000000' : entry.isGoodDeal ? '#22c55e' : '#cbd5e1'} 
              stroke={entry.isSuspicious ? '#dc2626' : 'none'} // Bordure rouge si danger
              strokeWidth={entry.isSuspicious ? 2 : 0}
              fillOpacity={entry.isGoodDeal || entry.isSuspicious ? 1 : 0.6}
              r={entry.isSuspicious ? 6 : entry.isGoodDeal ? 6 : 4}
              className="cursor-pointer transition-all duration-300 hover:opacity-80"
            />
          ))}
        </Scatter>
      </ComposedChart>
    </ResponsiveContainer>
  );
}