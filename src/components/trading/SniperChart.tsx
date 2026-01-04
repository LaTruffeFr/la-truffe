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

interface SniperChartProps {
  data: VehicleWithScore[];
  onVehicleClick: (vehicle: VehicleWithScore) => void;
  trendLine: { slope: number; intercept: number };
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

// Calculate expected price from trend line
function getExpectedPrice(km: number, slope: number, intercept: number): number {
  return slope * km + intercept;
}

export function SniperChart({ data, onVehicleClick, trendLine }: SniperChartProps) {
  // Prepare chart data with trend line comparison
  const { chartData, trendLineData } = useMemo(() => {
    if (data.length === 0) return { chartData: [], trendLineData: [] };

    const minKm = Math.min(...data.map(v => v.kilometrage));
    const maxKm = Math.max(...data.map(v => v.kilometrage));

    // Generate trend line points
    const trendLineData = [
      { km: minKm, trendPrice: getExpectedPrice(minKm, trendLine.slope, trendLine.intercept) },
      { km: maxKm, trendPrice: getExpectedPrice(maxKm, trendLine.slope, trendLine.intercept) },
    ];

    // Mark each vehicle as good deal (below trend) or expensive (above trend)
    const chartData = data.map(v => {
      const expectedPrice = getExpectedPrice(v.kilometrage, trendLine.slope, trendLine.intercept);
      const isBelowTrend = v.prix < expectedPrice;
      const deviation = expectedPrice - v.prix; // positive = good deal
      return {
        ...v,
        km: v.kilometrage,
        price: v.prix,
        expectedPrice,
        isBelowTrend,
        deviation,
        deviationPercent: Math.round((deviation / expectedPrice) * 100),
      };
    });

    return { chartData, trendLineData };
  }, [data, trendLine]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].payload;
    if (!v.marque) return null; // It's a trend line point

    const isBelowTrend = v.isBelowTrend;

    return (
      <div className="bg-background/95 backdrop-blur-md p-4 shadow-2xl border border-border rounded-xl">
        <p className="font-bold text-foreground">{v.marque} {v.modele}</p>
        <p className="text-sm text-muted-foreground">{v.annee} • {v.kilometrage.toLocaleString()} km</p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Prix affiché</span>
            <span className="text-lg font-mono font-bold text-foreground">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.prix)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Prix estimé</span>
            <span className="text-sm font-mono text-muted-foreground">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.expectedPrice)}
            </span>
          </div>
          <div className={`flex justify-between items-center pt-2 border-t border-border`}>
            <span className="text-sm">{isBelowTrend ? 'Économie' : 'Surcoût'}</span>
            <span className={`font-bold font-mono ${isBelowTrend ? 'text-success' : 'text-destructive'}`}>
              {isBelowTrend ? '-' : '+'}{Math.abs(v.deviationPercent)}%
            </span>
          </div>
        </div>
        {isBelowTrend && (
          <p className="mt-3 text-xs text-success font-medium">✓ Cliquez pour voir l'opportunité</p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />
          <XAxis
            type="number"
            dataKey="km"
            domain={['dataMin - 5000', 'dataMax + 5000']}
            tickFormatter={formatKm}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Kilométrage',
              position: 'bottom',
              offset: 15,
              style: { fontSize: 13, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }
            }}
          />
          <YAxis
            type="number"
            dataKey="price"
            domain={['dataMin - 2000', 'dataMax + 2000']}
            tickFormatter={formatPrice}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Prix',
              angle: -90,
              position: 'insideLeft',
              offset: -10,
              style: { fontSize: 13, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Trend line */}
          <Line
            data={trendLineData}
            type="linear"
            dataKey="trendPrice"
            stroke="hsl(0, 85%, 55%)"
            strokeWidth={3}
            dot={false}
            name="Tendance"
            legendType="none"
          />

          {/* Scatter points */}
          <Scatter
            data={chartData}
            shape="circle"
            onClick={(data: any) => {
              if (data?.payload && data.payload.isBelowTrend) {
                onVehicleClick(data.payload);
              }
            }}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isBelowTrend ? 'hsl(145, 100%, 45%)' : 'hsl(0, 70%, 55%)'}
                fillOpacity={entry.isBelowTrend ? 1 : 0.5}
                r={entry.isBelowTrend ? 7 : 4}
                style={{ cursor: entry.isBelowTrend ? 'pointer' : 'default' }}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
