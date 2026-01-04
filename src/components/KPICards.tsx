import { Car, Target, TrendingUp, Wallet } from "lucide-react";
import { MarketStats } from "@/types/vehicle";

interface KPICardsProps {
  stats: MarketStats;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function KPICards({ stats, isLoading }: KPICardsProps) {
  const kpis = [
    {
      label: "Véhicules Scannés",
      value: formatNumber(stats.totalVehicules),
      icon: Car,
      color: "text-muted-foreground",
      bgColor: "bg-muted/30",
    },
    {
      label: "Opportunités Détectées",
      value: formatNumber(stats.opportunitesDetectees),
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
      glow: true,
    },
    {
      label: "Marge Moyenne",
      value: formatCurrency(stats.margeMoyenne),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Budget Opportunités",
      value: formatCurrency(stats.budgetTotal),
      icon: Wallet,
      color: "text-chart-neutral",
      bgColor: "bg-chart-neutral/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className={`glass-card p-4 animate-fade-in ${kpi.glow ? 'success-glow' : ''}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold font-mono ${kpi.color}`}>
              {isLoading ? (
                <span className="inline-block w-24 h-7 bg-muted animate-pulse rounded" />
              ) : (
                kpi.value
              )}
            </p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
