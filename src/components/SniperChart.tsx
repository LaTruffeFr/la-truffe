import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Crosshair } from "lucide-react";
import { Vehicle } from "@/types/vehicle";

interface SniperChartProps {
  vehicles: Vehicle[];
  onVehicleClick?: (vehicle: Vehicle) => void;
}

function formatKm(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value}€`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: Vehicle;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const vehicle = payload[0].payload;
  const gain = vehicle.gainPotentiel || 0;

  return (
    <div className="glass-card p-3 max-w-xs border border-border shadow-xl">
      {vehicle.image && (
        <div className="w-full h-24 rounded-md overflow-hidden mb-2 bg-muted">
          <img
            src={vehicle.image}
            alt={vehicle.titre}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <p className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
        {vehicle.titre}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Prix:</span>
          <span className="ml-1 font-mono font-semibold text-foreground">
            {vehicle.prix.toLocaleString('fr-FR')}€
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">KM:</span>
          <span className="ml-1 font-mono text-foreground">
            {vehicle.kilometrage.toLocaleString('fr-FR')}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Année:</span>
          <span className="ml-1 font-mono text-foreground">{vehicle.annee}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Gain:</span>
          <span className={`ml-1 font-mono font-bold ${gain > 0 ? 'text-success' : 'text-destructive'}`}>
            {gain > 0 ? '+' : ''}{gain.toLocaleString('fr-FR')}€
          </span>
        </div>
      </div>
    </div>
  );
}

export function SniperChart({ vehicles, onVehicleClick }: SniperChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return vehicles.slice(0, 2000).map((v, index) => ({
      ...v,
      index,
    }));
  }, [vehicles]);

  const getColor = (vehicle: Vehicle) => {
    const gain = vehicle.gainPotentiel || 0;
    if (gain > 2000) return "hsl(145, 100%, 45%)";
    if (gain > 0) return "hsl(145, 70%, 40%)";
    if (gain > -1000) return "hsl(220, 10%, 45%)";
    return "hsl(0, 72%, 55%)";
  };

  return (
    <div className="glass-card p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Crosshair className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Sniper View</h3>
          <p className="text-sm text-muted-foreground">
            Prix vs Kilométrage • {vehicles.length.toLocaleString()} véhicules
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Gain {'>'} 2000€</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(145, 70%, 40%)' }} />
          <span className="text-muted-foreground">Gain {'>'} 0€</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-neutral" />
          <span className="text-muted-foreground">Neutre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Surcote</span>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 15%, 18%)"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              dataKey="kilometrage"
              name="KM"
              tickFormatter={formatKm}
              stroke="hsl(220, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
              label={{
                value: 'Kilométrage',
                position: 'bottom',
                offset: 0,
                style: { fill: 'hsl(220, 10%, 55%)', fontSize: 12 }
              }}
            />
            <YAxis
              type="number"
              dataKey="prix"
              name="Prix"
              tickFormatter={formatPrice}
              stroke="hsl(220, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
              label={{
                value: 'Prix',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(220, 10%, 55%)', fontSize: 12 }
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: 'hsl(43, 74%, 52%)' }}
            />
            <Scatter
              data={chartData}
              onClick={(data) => onVehicleClick?.(data as Vehicle)}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={getColor(entry)}
                  fillOpacity={activeIndex === index ? 1 : 0.7}
                  stroke={activeIndex === index ? 'hsl(43, 74%, 52%)' : 'transparent'}
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
