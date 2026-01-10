import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  BarChart3, 
  Target, 
  Award,
  ExternalLink,
  Gauge,
  Calendar,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vehicle {
  id: string;
  titre: string;
  marque: string;
  modele: string;
  prix: number;
  kilometrage: number;
  annee?: number | null;
  carburant?: string | null;
  localisation?: string | null;
  lien?: string | null;
  image?: string | null;
  gainPotentiel?: number;
  prixMedianSegment?: number;
}

interface MarketAnalysisSectionProps {
  currentVehicle: Vehicle;
  allVehicles: Vehicle[];
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

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
  payload?: Array<{ payload: Vehicle & { isCurrentVehicle?: boolean } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const vehicle = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl max-w-xs">
      <p className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
        {vehicle.titre}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Prix:</span>
          <span className="ml-1 font-mono font-semibold text-foreground">
            {formatCurrency(vehicle.prix)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">KM:</span>
          <span className="ml-1 font-mono text-foreground">
            {formatNumber(vehicle.kilometrage)}
          </span>
        </div>
        {vehicle.annee && (
          <div>
            <span className="text-muted-foreground">Année:</span>
            <span className="ml-1 font-mono text-foreground">{vehicle.annee}</span>
          </div>
        )}
      </div>
      {vehicle.isCurrentVehicle && (
        <Badge className="mt-2 bg-amber-500/20 text-amber-600 border-amber-500/30">
          Offre actuelle
        </Badge>
      )}
    </div>
  );
}

export function MarketAnalysisSection({ currentVehicle, allVehicles }: MarketAnalysisSectionProps) {
  // Calculate market statistics
  const marketStats = useMemo(() => {
    if (allVehicles.length === 0) return null;

    const totalPrices = allVehicles.reduce((sum, v) => sum + v.prix, 0);
    const avgMarketPrice = totalPrices / allVehicles.length;
    const currentPrice = currentVehicle.prix;
    const savings = avgMarketPrice - currentPrice;
    const savingsPercent = (savings / avgMarketPrice) * 100;

    // Determine price positioning badge
    let positioning: { label: string; color: string; bgColor: string };
    if (savingsPercent >= 10) {
      positioning = { label: "Excellent", color: "text-green-600", bgColor: "bg-green-500/10 border-green-500/30" };
    } else if (savingsPercent >= -10) {
      positioning = { label: "Juste", color: "text-amber-600", bgColor: "bg-amber-500/10 border-amber-500/30" };
    } else {
      positioning = { label: "Premium", color: "text-muted-foreground", bgColor: "bg-muted/50 border-muted-foreground/30" };
    }

    return {
      avgMarketPrice: Math.round(avgMarketPrice),
      currentPrice,
      savings: Math.round(savings),
      savingsPercent: Math.round(savingsPercent),
      positioning,
      totalVehicles: allVehicles.length,
    };
  }, [allVehicles, currentVehicle]);

  // Prepare chart data
  const { chartData, trendLine, bounds } = useMemo(() => {
    const points = allVehicles.map(v => ({ x: v.kilometrage, y: v.prix }));
    const { slope, intercept } = calculateTrendLine(points);

    const minKm = Math.min(...allVehicles.map(v => v.kilometrage), currentVehicle.kilometrage);
    const maxKm = Math.max(...allVehicles.map(v => v.kilometrage), currentVehicle.kilometrage);
    const minPrice = Math.min(...allVehicles.map(v => v.prix), currentVehicle.prix);
    const maxPrice = Math.max(...allVehicles.map(v => v.prix), currentVehicle.prix);

    const kmPadding = (maxKm - minKm) * 0.1;
    const pricePadding = (maxPrice - minPrice) * 0.1;

    const bounds = {
      xMin: Math.max(0, minKm - kmPadding),
      xMax: maxKm + kmPadding,
      yMin: Math.max(0, minPrice - pricePadding),
      yMax: maxPrice + pricePadding,
    };

    // Other vehicles (market)
    const marketData = allVehicles
      .filter(v => v.id !== currentVehicle.id)
      .map(v => ({
        ...v,
        isCurrentVehicle: false,
      }));

    // Current vehicle (highlighted)
    const currentData = [{
      ...currentVehicle,
      isCurrentVehicle: true,
    }];

    return {
      chartData: { market: marketData, current: currentData },
      trendLine: { slope, intercept, points: [
        { km: bounds.xMin, price: slope * bounds.xMin + intercept },
        { km: bounds.xMax, price: slope * bounds.xMax + intercept },
      ]},
      bounds,
    };
  }, [allVehicles, currentVehicle]);

  // Calculate top 10 opportunities
  const topOpportunities = useMemo(() => {
    return allVehicles
      .map(v => {
        const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
        const ecartMarche = ((v.prix - expectedPrice) / expectedPrice) * 100;
        return {
          ...v,
          ecartMarche: Math.round(ecartMarche),
          isCurrentVehicle: v.id === currentVehicle.id,
        };
      })
      .sort((a, b) => a.prix - b.prix)
      .slice(0, 10);
  }, [allVehicles, currentVehicle, trendLine]);

  if (!marketStats || allVehicles.length < 3) {
    return null;
  }

  return (
    <section className="space-y-8">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analyse de Marché</h2>
          <p className="text-sm text-muted-foreground">
            Comparaison avec {marketStats.totalVehicles} annonces similaires
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Prix Moyen Marché */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Prix Moyen Marché</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(marketStats.avgMarketPrice)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Basé sur {marketStats.totalVehicles} annonces
            </p>
          </CardContent>
        </Card>

        {/* Prix La Truffe */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Prix La Truffe</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(marketStats.currentPrice)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cette annonce
            </p>
          </CardContent>
        </Card>

        {/* Économie Potentielle */}
        <Card className={`${marketStats.savings > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Économie Potentielle</p>
                <p className={`text-2xl font-bold ${marketStats.savings > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {marketStats.savings > 0 ? '+' : ''}{formatCurrency(marketStats.savings)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${marketStats.savings > 0 ? 'bg-green-500/10' : 'bg-muted'}`}>
                <TrendingDown className={`w-4 h-4 ${marketStats.savings > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {marketStats.savingsPercent > 0 ? `-${marketStats.savingsPercent}%` : `+${Math.abs(marketStats.savingsPercent)}%`} vs marché
            </p>
          </CardContent>
        </Card>

        {/* Positionnement Prix */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Positionnement Prix</p>
                <Badge className={`${marketStats.positioning.bgColor} ${marketStats.positioning.color} text-lg font-bold px-3 py-1 mt-1`}>
                  {marketStats.positioning.label}
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <Award className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Par rapport à la moyenne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="w-5 h-5 text-primary" />
            Position sur le Marché
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">Marché ({chartData.market.length} annonces)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Offre Actuelle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary" style={{ background: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 4px, transparent 4px, transparent 8px)' }} />
              <span className="text-muted-foreground">Tendance du marché</span>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="kilometrage"
                  name="KM"
                  domain={[bounds.xMin, bounds.xMax]}
                  tickFormatter={formatKm}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{
                    value: 'Kilométrage',
                    position: 'bottom',
                    offset: 20,
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="prix"
                  name="Prix"
                  domain={[bounds.yMin, bounds.yMax]}
                  tickFormatter={formatPrice}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{
                    value: 'Prix (€)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Trend Line */}
                <ReferenceLine
                  segment={[
                    { x: trendLine.points[0].km, y: trendLine.points[0].price },
                    { x: trendLine.points[1].km, y: trendLine.points[1].price },
                  ]}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />

                {/* Market vehicles */}
                <Scatter
                  data={chartData.market}
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.4}
                >
                  {chartData.market.map((entry, index) => (
                    <Cell
                      key={`market-${index}`}
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.4}
                      r={4}
                    />
                  ))}
                </Scatter>

                {/* Current vehicle - highlighted */}
                <Scatter
                  data={chartData.current}
                  fill="#f59e0b"
                >
                  {chartData.current.map((entry, index) => (
                    <Cell
                      key={`current-${index}`}
                      fill="#f59e0b"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      r={10}
                    />
                  ))}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Opportunities Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-primary" />
            Top 10 Opportunités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Titre</TableHead>
                  <TableHead className="text-right font-semibold">Kilométrage</TableHead>
                  <TableHead className="text-right font-semibold">Prix</TableHead>
                  <TableHead className="text-right font-semibold">Écart Marché</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOpportunities.map((vehicle, index) => (
                  <TableRow 
                    key={vehicle.id} 
                    className={vehicle.isCurrentVehicle ? 'bg-amber-500/10 border-amber-500/30' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">#{index + 1}</span>
                        <div className="truncate max-w-[200px] md:max-w-[300px]">
                          {vehicle.titre}
                        </div>
                        {vehicle.isCurrentVehicle && (
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs shrink-0">
                            Offre actuelle
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vehicle.kilometrage)} km
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(vehicle.prix)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline"
                        className={
                          vehicle.ecartMarche < -10 
                            ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                            : vehicle.ecartMarche > 10 
                              ? 'bg-red-500/10 text-red-600 border-red-500/30'
                              : 'bg-muted text-muted-foreground'
                        }
                      >
                        {vehicle.ecartMarche > 0 ? '+' : ''}{vehicle.ecartMarche}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.lien && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(vehicle.lien!, '_blank')}
                          className="h-8 px-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {topOpportunities.some(v => v.isCurrentVehicle) && (
            <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
              <Award className="w-4 h-4" />
              L'offre actuelle fait partie du Top 10 — c'est une bonne affaire !
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
