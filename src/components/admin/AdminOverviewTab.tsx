import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Zap, Euro, TrendingUp } from 'lucide-react';
import { Cell } from 'recharts';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart, Cell as RechartsCell,
} from 'recharts';

// Demo data — will be replaced by real Supabase queries
const activityData = [
  { jour: 'Lun', audits: 18, inscriptions: 5 },
  { jour: 'Mar', audits: 24, inscriptions: 8 },
  { jour: 'Mer', audits: 31, inscriptions: 6 },
  { jour: 'Jeu', audits: 22, inscriptions: 12 },
  { jour: 'Ven', audits: 38, inscriptions: 9 },
  { jour: 'Sam', audits: 45, inscriptions: 14 },
  { jour: 'Dim', audits: 29, inscriptions: 7 },
];

const topModels = [
  { modele: 'Renault Clio', audits: 342 },
  { modele: 'VW Golf', audits: 287 },
  { modele: 'Peugeot 208', audits: 256 },
  { modele: 'BMW Série 3', audits: 198 },
  { modele: 'Audi A3', audits: 174 },
];

const COLORS = ['#6366f1', '#8b5cf6', '#64748b', '#a78bfa', '#475569'];

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: string;
}

const KPICard = ({ title, value, icon: Icon, color, bgColor, trend }: KPICardProps) => (
  <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
          <p className="text-3xl font-[1000] tracking-tighter text-slate-900">{value}</p>
          {trend && <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface AdminOverviewTabProps {
  totalUsers: number;
  totalReports: number;
}

const AdminOverviewTab = ({ totalUsers, totalReports }: AdminOverviewTabProps) => {
  return (
    <div className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vue d'Ensemble</h2>
        <p className="text-slate-500 font-medium mt-1">Tableau de bord en temps réel — La Truffe HQ</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Utilisateurs Inscrits"
          value={totalUsers.toLocaleString('fr-FR')}
          icon={Users}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend="+12% ce mois"
        />
        <KPICard
          title="Audits Réalisés"
          value={totalReports.toLocaleString('fr-FR')}
          icon={FileText}
          color="text-violet-600"
          bgColor="bg-violet-50"
          trend="+23% ce mois"
        />
        <KPICard
          title="Crédits Dépensés Aujourd'hui"
          value="142"
          icon={Zap}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <KPICard
          title="MRR Estimé"
          value="2 450 €"
          icon={Euro}
          color="text-blue-600"
          bgColor="bg-blue-50"
          trend="+8% vs mois dernier"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart — Activity */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Activité des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAudits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInscriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="jour" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} />
                <Area type="monotone" dataKey="audits" name="Audits" stroke="#6366f1" strokeWidth={3} fill="url(#gradAudits)" dot={{ r: 4, fill: '#6366f1' }} />
                <Area type="monotone" dataKey="inscriptions" name="Inscriptions" stroke="#10b981" strokeWidth={3} fill="url(#gradInscriptions)" dot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart — Top models */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Top 5 des modèles audités</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topModels} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="modele" type="category" tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="audits" name="Audits" radius={[0, 8, 8, 0]} barSize={28}>
                  {topModels.map((_, index) => (
                    <rect key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
