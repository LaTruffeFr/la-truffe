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
  // Prepare chart data with trend line comparison + dynamic axis domains
  const { chartData, trendLineData, xDomain, yDomain } = useMemo(() => {
    if (data.length === 0) return { chartData: [], trendLineData: [], xDomain: [0, 100000] as [number, number], yDomain: [0, 50000] as [number, number] };

    const kms = data.map(v => v.kilometrage);
    const prices = data.map(v => v.prix);
    
    const minKm = Math.min(...kms);
    const maxKm = Math.max(...kms);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Dynamic padding: 5% of range, minimum 2000km / 1000€
    const kmRange = maxKm - minKm;
    const priceRange = maxPrice - minPrice;
    const kmPadding = Math.max(kmRange * 0.05, 2000);
    const pricePadding = Math.max(priceRange * 0.05, 1000);

    // Calculate domains with padding
    const xDomain: [number, number] = [
      Math.max(0, Math.floor((minKm - kmPadding) / 1000) * 1000),
      Math.ceil((maxKm + kmPadding) / 1000) * 1000
    ];
    const yDomain: [number, number] = [
      Math.max(0, Math.floor((minPrice - pricePadding) / 1000) * 1000),
      Math.ceil((maxPrice + pricePadding) / 1000) * 1000
    ];

    // Generate trend line points spanning the full X domain
    const trendLineData = [
      { km: xDomain[0], trendPrice: getExpectedPrice(xDomain[0], trendLine.slope, trendLine.intercept) },
      { km: xDomain[1], trendPrice: getExpectedPrice(xDomain[1], trendLine.slope, trendLine.intercept) },
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

    return { chartData, trendLineData, xDomain, yDomain };
  }, [data, trendLine]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].payload;
    if (!v.marque) return null; // It's a trend line point

    const isBelowTrend = v.isBelowTrend;

    return (
      <div className="bg-white p-5 shadow-lg rounded-2xl border border-gray-100 min-w-[240px]">
        {/* Header with model info */}
        <div className="mb-4">
          <p className="font-bold text-gray-900 text-lg">{v.marque} {v.modele}</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className="font-medium">{v.annee}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{v.kilometrage.toLocaleString('fr-FR')} km</span>
          </div>
        </div>
        
        {/* Price info */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Prix affiché</span>
            <span className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.prix)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Prix estimé</span>
            <span className="text-sm font-medium text-gray-600">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v.expectedPrice)}
            </span>
          </div>
        </div>
        
        {/* Deal indicator */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${isBelowTrend ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className="text-sm font-medium text-gray-700">{isBelowTrend ? 'Économie' : 'Surcoût'}</span>
          <span className={`text-lg font-bold ${isBelowTrend ? 'text-green-600' : 'text-red-500'}`}>
            {isBelowTrend ? '-' : '+'}{Math.abs(v.deviationPercent)}%
          </span>
        </div>
        
        {isBelowTrend && (
          <p className="mt-3 text-xs text-green-600 font-medium text-center">✓ Cliquez pour voir l'opportunité</p>
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
            domain={xDomain}
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
            domain={yDomain}
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
