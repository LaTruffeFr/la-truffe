import { useMemo, useState, useCallback, useRef } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { Crosshair, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";
import { Vehicle } from "@/types/vehicle";
import { Button } from "@/components/ui/button";

interface SniperChartOptimizedProps {
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

// Linear regression calculation
function calculateTrendLine(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Vehicle & { trendPrice: number; delta: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const vehicle = payload[0].payload;
  const delta = vehicle.delta || 0;

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
          <span className="text-muted-foreground">Prix Juste:</span>
          <span className="ml-1 font-mono text-foreground">
            {Math.round(vehicle.trendPrice || 0).toLocaleString('fr-FR')}€
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Écart:</span>
          <span className={`ml-1 font-mono font-bold ${delta < 0 ? 'text-success' : 'text-destructive'}`}>
            {delta < 0 ? '' : '+'}{Math.round(delta).toLocaleString('fr-FR')}€
          </span>
        </div>
      </div>
    </div>
  );
}

interface ZoomState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function SniperChartOptimized({ vehicles, onVehicleClick }: SniperChartOptimizedProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; zoom: ZoomState } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Sample data for performance (max 5000 points)
  const sampledData = useMemo(() => {
    if (vehicles.length <= 5000) return vehicles;
    
    // Stratified sampling: keep all opportunities, sample the rest
    const opportunities = vehicles.filter(v => (v.gainPotentiel || 0) > 1000);
    const rest = vehicles.filter(v => (v.gainPotentiel || 0) <= 1000);
    
    const sampleSize = Math.min(5000 - opportunities.length, rest.length);
    const step = rest.length / sampleSize;
    const sampled = [];
    
    for (let i = 0; i < sampleSize; i++) {
      sampled.push(rest[Math.floor(i * step)]);
    }
    
    return [...opportunities, ...sampled];
  }, [vehicles]);

  // Calculate trend line
  const { trendLine, chartData, defaultBounds } = useMemo(() => {
    const points = sampledData.map(v => ({ x: v.kilometrage, y: v.prix }));
    const { slope, intercept } = calculateTrendLine(points);

    const minKm = Math.min(...sampledData.map(v => v.kilometrage));
    const maxKm = Math.max(...sampledData.map(v => v.kilometrage));
    const minPrice = Math.min(...sampledData.map(v => v.prix));
    const maxPrice = Math.max(...sampledData.map(v => v.prix));

    // Extend bounds by 5%
    const kmPadding = (maxKm - minKm) * 0.05;
    const pricePadding = (maxPrice - minPrice) * 0.05;

    const bounds: ZoomState = {
      xMin: Math.max(0, minKm - kmPadding),
      xMax: maxKm + kmPadding,
      yMin: Math.max(0, minPrice - pricePadding),
      yMax: maxPrice + pricePadding,
    };

    // Create trend line data points
    const trendPoints = [
      { km: bounds.xMin, price: slope * bounds.xMin + intercept },
      { km: bounds.xMax, price: slope * bounds.xMax + intercept },
    ];

    // Enrich vehicle data with trend price and delta
    const enriched = sampledData.map((v, index) => {
      const trendPrice = slope * v.kilometrage + intercept;
      const delta = v.prix - trendPrice;
      return {
        ...v,
        index,
        trendPrice,
        delta, // negative = below trend = good deal
      };
    });

    return { 
      trendLine: { slope, intercept, points: trendPoints }, 
      chartData: enriched,
      defaultBounds: bounds,
    };
  }, [sampledData]);

  // Current bounds (zoom or default)
  const bounds = zoom || defaultBounds;

  // Color based on position relative to trend line
  const getColor = useCallback((delta: number) => {
    if (delta < -2000) return "hsl(145, 100%, 45%)"; // Very good deal
    if (delta < 0) return "hsl(145, 70%, 40%)";      // Good deal
    if (delta < 1000) return "hsl(220, 10%, 45%)";   // Neutral
    return "hsl(0, 72%, 55%)";                        // Overpriced
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const current = prev || defaultBounds;
      const xRange = current.xMax - current.xMin;
      const yRange = current.yMax - current.yMin;
      const xCenter = (current.xMax + current.xMin) / 2;
      const yCenter = (current.yMax + current.yMin) / 2;
      
      return {
        xMin: xCenter - xRange * 0.35,
        xMax: xCenter + xRange * 0.35,
        yMin: yCenter - yRange * 0.35,
        yMax: yCenter + yRange * 0.35,
      };
    });
  }, [defaultBounds]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const current = prev || defaultBounds;
      const xRange = current.xMax - current.xMin;
      const yRange = current.yMax - current.yMin;
      const xCenter = (current.xMax + current.xMin) / 2;
      const yCenter = (current.yMax + current.yMin) / 2;
      
      return {
        xMin: Math.max(0, xCenter - xRange * 0.65),
        xMax: xCenter + xRange * 0.65,
        yMin: Math.max(0, yCenter - yRange * 0.65),
        yMax: yCenter + yRange * 0.65,
      };
    });
  }, [defaultBounds]);

  const handleReset = useCallback(() => {
    setZoom(null);
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPanning && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      panStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        zoom: zoom || defaultBounds,
      };
    }
  }, [isPanning, zoom, defaultBounds]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panStartRef.current || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - panStartRef.current.x;
    const deltaY = currentY - panStartRef.current.y;
    
    const { zoom: startZoom } = panStartRef.current;
    const xRange = startZoom.xMax - startZoom.xMin;
    const yRange = startZoom.yMax - startZoom.yMin;
    
    // Convert pixel delta to data delta
    const xDataDelta = (deltaX / rect.width) * xRange * -1;
    const yDataDelta = (deltaY / rect.height) * yRange;
    
    setZoom({
      xMin: Math.max(0, startZoom.xMin + xDataDelta),
      xMax: startZoom.xMax + xDataDelta,
      yMin: Math.max(0, startZoom.yMin + yDataDelta),
      yMax: startZoom.yMax + yDataDelta,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    panStartRef.current = null;
  }, []);

  // Stats for legend
  const stats = useMemo(() => {
    const belowTrend = chartData.filter(v => v.delta < 0).length;
    const aboveTrend = chartData.length - belowTrend;
    return { belowTrend, aboveTrend };
  }, [chartData]);

  return (
    <div className="glass-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Crosshair className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sniper View</h3>
            <p className="text-sm text-muted-foreground">
              Prix vs Kilométrage • {vehicles.length.toLocaleString()} véhicules
              {vehicles.length > 5000 && ` (${sampledData.length.toLocaleString()} affichés)`}
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant={isPanning ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPanning(!isPanning)}
            title="Mode déplacement"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom +">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom -">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="Réinitialiser">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Sous la tendance ({stats.belowTrend})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Au-dessus ({stats.aboveTrend})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary" />
          <span className="text-muted-foreground">Prix Juste (Tendance)</span>
        </div>
      </div>

      <div 
        ref={chartRef}
        className={`h-[450px] w-full ${isPanning ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 15%, 18%)"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              dataKey="kilometrage"
              name="KM"
              domain={[bounds.xMin, bounds.xMax]}
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
              domain={[bounds.yMin, bounds.yMax]}
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
            
            {/* Trend Line */}
            <ReferenceLine
              segment={[
                { x: trendLine.points[0].km, y: trendLine.points[0].price },
                { x: trendLine.points[1].km, y: trendLine.points[1].price },
              ]}
              stroke="hsl(43, 74%, 52%)"
              strokeWidth={2}
              strokeDasharray="5 5"
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
                  fill={getColor(entry.delta)}
                  fillOpacity={activeIndex === index ? 1 : 0.7}
                  stroke={activeIndex === index ? 'hsl(43, 74%, 52%)' : 'transparent'}
                  strokeWidth={2}
                  r={activeIndex === index ? 6 : 4}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Trend formula display */}
      <div className="mt-4 text-xs text-muted-foreground text-center font-mono">
        Prix Juste = {trendLine.intercept.toFixed(0)}€ + ({(trendLine.slope * 1000).toFixed(2)}€ × km/1000)
      </div>
    </div>
  );
}
