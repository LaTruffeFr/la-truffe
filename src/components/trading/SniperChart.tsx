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
  ReferenceLine,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface SniperChartProps {
  data: VehicleWithScore[];
  showAll: boolean;
  onToggleShowAll: () => void;
  totalCount: number;
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value}€`;
}

function formatKm(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

export function SniperChart({ data, showAll, onToggleShowAll, totalCount }: SniperChartProps) {
  // Calculate average price line (simple linear regression approximation)
  const avgPriceLine = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, v) => sum + v.prixMoyen, 0) / data.length;
  }, [data]);

  // Prepare chart data with color info
  const chartData = useMemo(() => {
    return data.map(v => ({
      ...v,
      x: v.kilometrage,
      y: v.prix,
      isGoodDeal: v.dealScore >= 70,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].payload as VehicleWithScore;

    return (
      <div className="glass-card p-3 shadow-xl border border-border">
        <p className="font-semibold text-sm text-foreground">{v.marque} {v.modele}</p>
        <p className="text-xs text-muted-foreground">{v.annee} • {v.kilometrage.toLocaleString()} km</p>
        <div className="mt-2 space-y-1">
          <p className="text-lg font-mono font-bold text-foreground">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.prix)}
          </p>
          <p className="text-xs">
            Marché: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.prixMoyen)}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${v.ecartPourcent < 0 ? 'text-success' : 'text-destructive'}`}>
              {v.ecartPourcent > 0 ? '+' : ''}{v.ecartPourcent}%
            </span>
            <span className="text-xs text-muted-foreground">
              Score: {v.dealScore}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-foreground">Graphique Sniper</h3>
          <p className="text-xs text-muted-foreground">
            {data.length} points affichés sur {totalCount}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleShowAll}
          className="gap-2"
        >
          {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showAll ? 'Top 500' : 'Tout afficher'}
        </Button>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              dataKey="x"
              name="Kilométrage"
              tickFormatter={formatKm}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: 'Kilométrage',
                position: 'bottom',
                offset: 0,
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Prix"
              tickFormatter={formatPrice}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: 'Prix',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Average line */}
            <ReferenceLine
              y={avgPriceLine}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              strokeWidth={2}
            />

            <Scatter data={chartData} shape="circle">
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isGoodDeal ? 'hsl(145, 100%, 45%)' : 'hsl(var(--muted-foreground))'}
                  fillOpacity={entry.isGoodDeal ? 0.9 : 0.4}
                  r={entry.isGoodDeal ? 5 : 3}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Bonnes affaires (Score ≥70)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Autres véhicules</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-primary" />
          <span className="text-muted-foreground">Prix moyen</span>
        </div>
      </div>
    </div>
  );
}
