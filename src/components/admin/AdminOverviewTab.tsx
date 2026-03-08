import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Zap, Euro, TrendingUp, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart, Cell as RechartsCell,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#6366f1', '#8b5cf6', '#64748b', '#a78bfa', '#475569'];
const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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

const AdminOverviewTab = () => {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [creditsToday, setCreditsToday] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activityData, setActivityData] = useState<{ jour: string; audits: number; inscriptions: number }[]>([]);
  const [topModels, setTopModels] = useState<{ modele: string; audits: number }[]>([]);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      // Fetch all in parallel
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [usersRes, reportsRes, paymentsRes, recentReportsRes, recentUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('processed_payments').select('credits'),
        supabase.from('reports').select('created_at, marque, modele').gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('created_at').gte('created_at', sevenDaysAgo),
      ]);

      // KPIs
      setTotalUsers(usersRes.count || 0);
      setTotalReports(reportsRes.count || 0);

      // Credits today: count reports created today as proxy
      const todayReports = (recentReportsRes.data || []).filter(r => r.created_at >= todayStart);
      setCreditsToday(todayReports.length);

      // Revenue from payments
      const totalCredits = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + (p.credits || 0), 0);
      // Estimate: average ~4.90€ per credit
      setTotalRevenue(Math.round(totalCredits * 4.9));

      // Activity chart: group reports & signups by day of week for last 7 days
      const reports7d = recentReportsRes.data || [];
      const users7d = recentUsersRes.data || [];

      // Build day-by-day for last 7 days
      const dayMap: Record<string, { audits: number; inscriptions: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { audits: 0, inscriptions: 0 };
      }

      reports7d.forEach((r: any) => {
        const key = r.created_at.slice(0, 10);
        if (dayMap[key]) dayMap[key].audits++;
      });

      users7d.forEach((u: any) => {
        const key = u.created_at.slice(0, 10);
        if (dayMap[key]) dayMap[key].inscriptions++;
      });

      const activity = Object.entries(dayMap).map(([dateStr, vals]) => {
        const d = new Date(dateStr);
        return { jour: JOURS[d.getDay()], ...vals };
      });
      setActivityData(activity);

      // Top models: aggregate from all reports (last 1000)
      const modelCount: Record<string, number> = {};
      reports7d.forEach((r: any) => {
        if (r.marque && r.marque !== 'INCONNU' && r.marque !== 'NON DISPONIBLE') {
          const label = `${r.marque} ${r.modele || ''}`.trim();
          modelCount[label] = (modelCount[label] || 0) + 1;
        }
      });

      // For top models, fetch ALL reports (not just 7 days)
      const allReportsRes = await supabase.from('reports').select('marque, modele');
      const allModelCount: Record<string, number> = {};
      (allReportsRes.data || []).forEach((r: any) => {
        if (r.marque && r.marque !== 'INCONNU' && r.marque !== 'NON DISPONIBLE') {
          const label = `${r.marque} ${r.modele || ''}`.trim();
          allModelCount[label] = (allModelCount[label] || 0) + 1;
        }
      });

      const sorted = Object.entries(allModelCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([modele, audits]) => ({ modele, audits }));
      setTopModels(sorted);

    } catch (e) {
      console.error('Admin stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 m-0 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vue d'Ensemble</h2>
        <p className="text-slate-500 font-medium mt-1">Tableau de bord en temps réel — La Truffe HQ</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Utilisateurs Inscrits" value={totalUsers.toLocaleString('fr-FR')} icon={Users} color="text-emerald-600" bgColor="bg-emerald-50" />
        <KPICard title="Audits Réalisés" value={totalReports.toLocaleString('fr-FR')} icon={FileText} color="text-violet-600" bgColor="bg-violet-50" />
        <KPICard title="Crédits Aujourd'hui" value={creditsToday.toLocaleString('fr-FR')} icon={Zap} color="text-amber-600" bgColor="bg-amber-50" />
        <KPICard title="Revenus Totaux (est.)" value={`${totalRevenue.toLocaleString('fr-FR')} €`} icon={Euro} color="text-blue-600" bgColor="bg-blue-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} />
                <Area type="monotone" dataKey="audits" name="Audits" stroke="#6366f1" strokeWidth={3} fill="url(#gradAudits)" dot={{ r: 4, fill: '#6366f1' }} />
                <Area type="monotone" dataKey="inscriptions" name="Inscriptions" stroke="#10b981" strokeWidth={3} fill="url(#gradInscriptions)" dot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Top modèles audités</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {topModels.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topModels} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="modele" type="category" tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 700 }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="audits" name="Audits" radius={[0, 8, 8, 0]} barSize={28}>
                    {topModels.map((_, index) => (
                      <RechartsCell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm py-10 text-center">Aucun audit enregistré pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
