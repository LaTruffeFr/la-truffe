import { Car, Target, TrendingUp, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { MarketStats } from "@/types/vehicle";
import { StatsCounter } from "./StatsCounter";
import { SkeletonKPI } from "./ui/skeleton-card";

interface KPICardsProps {
  stats: MarketStats;
  isLoading?: boolean;
  previousStats?: MarketStats;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function KPICards({ stats, isLoading, previousStats }: KPICardsProps) {
  const kpis = [
    {
      label: "Véhicules Scannés",
      value: stats.totalVehicules,
      previousValue: previousStats?.totalVehicules,
      icon: Car,
      color: "text-muted-foreground",
      bgColor: "bg-muted/30",
      formatter: (v: number) => v.toLocaleString('fr-FR'),
    },
    {
      label: "Opportunités",
      value: stats.opportunitesDetectees,
      previousValue: previousStats?.opportunitesDetectees,
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
      glow: true,
      formatter: (v: number) => v.toLocaleString('fr-FR'),
    },
    {
      label: "Marge Moyenne",
      value: stats.margeMoyenne,
      previousValue: previousStats?.margeMoyenne,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      formatter: formatCurrency,
    },
    {
      label: "Budget Total",
      value: stats.budgetTotal,
      previousValue: previousStats?.budgetTotal,
      icon: Wallet,
      color: "text-chart-neutral",
      bgColor: "bg-chart-neutral/10",
      formatter: formatCurrency,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const diff = kpi.previousValue !== undefined 
          ? kpi.value - kpi.previousValue 
          : undefined;
        const showTrend = diff !== undefined && diff !== 0;

        return (
          <div
            key={kpi.label}
            className={`glass-card p-4 animate-fade-in hover:scale-[1.02] transition-transform duration-300 ${kpi.glow ? 'success-glow' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {showTrend && (
                <div className={`flex items-center gap-1 text-xs ${diff > 0 ? 'text-success' : 'text-destructive'}`}>
                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{Math.abs(diff).toLocaleString('fr-FR')}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold font-mono ${kpi.color}`}>
                <StatsCounter
                  value={kpi.value}
                  formatter={kpi.formatter}
                  duration={800}
                />
              </p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
