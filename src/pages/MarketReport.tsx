import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { mockVehicles, mockMarketStats, MockVehicle } from '@/data/mockVehicles';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceArea } from 'recharts';
import { ArrowLeft, Share2, Star, Heart, ExternalLink } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].payload as MockVehicle;
  return (
    <div className="bg-slate-900 text-white p-3 rounded-DEFAULT shadow-xl border border-slate-700 text-xs min-w-[180px]">
      {v.image_url && (
        <img src={v.image_url} alt={v.title} className="w-full h-20 object-cover rounded-sm mb-2" />
      )}
      <p className="font-bold mb-1">{v.title}</p>
      <p className="text-emerald-400 font-mono text-sm">{v.price.toLocaleString()} €</p>
      <p className="text-slate-400">{v.mileage.toLocaleString()} km</p>
      <p className="mt-1 font-semibold">Score: {v.truffe_score}/10</p>
    </div>
  );
};

const MarketReport = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'score' | 'price'>('score');
  const [sellerFilter, setSellerFilter] = useState<'all' | 'pro' | 'private'>('all');

  const filteredVehicles = useMemo(() => {
    let list = [...mockVehicles];
    if (sellerFilter === 'pro') list = list.filter(v => v.is_verified);
    if (sellerFilter === 'private') list = list.filter(v => !v.is_verified);
    if (sortBy === 'score') list.sort((a, b) => b.truffe_score - a.truffe_score);
    else list.sort((a, b) => a.price - b.price);
    return list;
  }, [sortBy, sellerFilter]);

  const chartData = mockVehicles.map(v => ({ ...v, km: v.mileage, prix: v.price }));

  // Good deal zone boundaries (low km, low price)
  const goodDealMaxKm = 60000;
  const goodDealMaxPrice = 15000;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-24 font-display relative">
      <Helmet><title>Renault Clio 4 - Market Report | LaTruffe</title></Helmet>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground leading-tight">Renault Clio 4</h1>
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Market Report</p>
        </div>
        <button className="p-2 -mr-2 rounded-full hover:bg-accent transition-colors text-muted-foreground">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 space-y-8 pt-4">
        {/* KPI Row */}
        <section className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
          {/* Avg Price */}
          <div className="snap-center shrink-0 w-40 p-4 bg-card rounded-DEFAULT shadow-sm border border-border flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-primary/10 rounded-full text-primary">💰</div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">📈 2%</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Prix Moyen</p>
              <p className="text-2xl font-bold text-foreground">{mockMarketStats.avgPrice.toLocaleString()}€</p>
            </div>
          </div>
          {/* Rating */}
          <div className="snap-center shrink-0 w-40 p-4 bg-card rounded-DEFAULT shadow-sm border border-border flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-primary/10 rounded-full text-primary">📊</div>
              <span className="text-xs font-bold text-primary">LaTruffe</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Rating</p>
                <p className="text-2xl font-bold text-foreground">{mockMarketStats.truffeScore}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
              </div>
              <div className="relative w-8 h-8 rounded-full border-4 border-border border-t-primary border-r-primary rotate-45" />
            </div>
          </div>
          {/* Reliability */}
          <div className="snap-center shrink-0 w-40 p-4 bg-card rounded-DEFAULT shadow-sm border border-border flex flex-col justify-between h-40">
            <div className="p-2 bg-primary/10 rounded-full text-primary w-fit">🛡️</div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Fiabilité</p>
              <div className="flex items-center text-yellow-400">
                {[1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                <Star className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-foreground mt-1">Haute</p>
            </div>
          </div>
        </section>

        {/* Chart */}
        <section className="bg-card p-5 rounded-DEFAULT shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Distribution des Prix</h2>
              <p className="text-xs text-muted-foreground">Prix vs Kilométrage (km)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 91%)" />
                {/* Good Deal Zone */}
                <ReferenceArea
                  x1={0} x2={goodDealMaxKm}
                  y1={0} y2={goodDealMaxPrice}
                  fill="hsl(142 76% 36%)"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                <XAxis
                  type="number" dataKey="km" name="Kilométrage"
                  tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number" dataKey="prix" name="Prix"
                  tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={chartData}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.truffe_score >= 8.5 ? '#22c55e' : '#0d7ff2'}
                      stroke="white"
                      strokeWidth={2}
                      r={entry.truffe_score >= 8.5 ? 7 : 5}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Marché</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Bonne Affaire</span>
            </div>
          </div>
          {/* Good Deal Zone label */}
          <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-2 opacity-70 text-center">
            Good Deal Zone — Prix bas & faible kilométrage
          </div>
        </section>

        {/* Sort & Filter */}
        <div className="flex items-center justify-between sticky top-[72px] bg-background py-2 z-20">
          <h3 className="text-xl font-bold text-foreground">Top Opportunités</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tri:</span>
            <button
              onClick={() => setSortBy(sortBy === 'score' ? 'price' : 'score')}
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
            >
              {sortBy === 'score' ? 'Score' : 'Prix'} ↓
            </button>
          </div>
        </div>

        {/* Vehicle Cards */}
        <div className="space-y-4 pb-8">
          {filteredVehicles.slice(0, 10).map((v) => (
            <div key={v.id} className="bg-card p-3 rounded-DEFAULT shadow-sm border border-border flex gap-4">
              <div className="relative w-28 h-28 shrink-0 rounded-DEFAULT overflow-hidden bg-accent">
                <img
                  src={v.image_url || `https://placehold.co/200x200/e2e8f0/94a3b8?text=${v.brand}`}
                  alt={v.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/200x200/e2e8f0/94a3b8?text=${v.brand}` }}
                />
                <div className={`absolute top-1.5 left-1.5 ${
                  v.truffe_score >= 9 ? 'bg-green-500' : v.truffe_score >= 7.5 ? 'bg-yellow-500' : 'bg-red-500'
                } text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm`}>
                  {v.truffe_score}/10
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-foreground text-sm leading-snug">{v.title}</h4>
                    <Heart className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{v.year} • {v.fuel} • {v.transmission}</p>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{v.mileage.toLocaleString()} km</p>
                    <p className={`text-lg font-bold ${v.truffe_score >= 9 ? 'text-primary' : 'text-foreground'}`}>
                      {v.price.toLocaleString()} €
                    </p>
                  </div>
                  <a
                    href={v.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      v.truffe_score >= 9
                        ? 'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-primary/10 hover:bg-primary hover:text-white text-primary'
                    } text-xs font-bold py-2 px-4 rounded-full transition-all`}
                  >
                    Voir
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Filter Bar */}
      <div className="fixed bottom-20 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border p-4 max-w-md mx-auto rounded-t-DEFAULT shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-700">Vendeur</span>
          <div className="flex bg-accent p-1 rounded-full">
            {(['all', 'pro', 'private'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSellerFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sellerFilter === f ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'pro' ? 'Pro' : 'Particulier'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketReport;
