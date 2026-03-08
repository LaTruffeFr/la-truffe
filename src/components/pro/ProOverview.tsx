import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Car, Euro, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function ProOverview() {
  const kpis = [
    { label: 'Véhicules en stock', value: '18', change: '+3', up: true, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Marge moyenne', value: '2 340 €', change: '+12%', up: true, icon: Euro, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Taux de conversion', value: '68%', change: '+5%', up: true, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'CA projeté (mois)', value: '42 120 €', change: '-2%', up: false, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  const recentActivity = [
    { action: 'Audit réalisé', target: 'BMW Série 3 320d 2019', time: 'Il y a 12 min', badge: 'Audit', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { action: 'Véhicule acheté', target: 'VW Golf 8 GTI 2021', time: 'Il y a 2h', badge: 'Achat', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { action: 'Rapport marque blanche', target: 'Peugeot 3008 GT', time: 'Il y a 5h', badge: 'PDF', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { action: 'Prêt à la vente', target: 'Renault Mégane RS', time: 'Hier', badge: 'Stock', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-slate-900 border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-mono ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">Activité récente</h3>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${item.badgeColor} text-[10px]`}>{item.badge}</Badge>
                <div>
                  <p className="text-sm text-white font-medium">{item.action}</p>
                  <p className="text-xs text-slate-400">{item.target}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
