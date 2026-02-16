import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { mockVehicles } from '@/data/mockVehicles';
import { ArrowLeft, Share2, MoreHorizontal, Heart, MessageCircle, CheckCircle2, AlertTriangle, Star } from 'lucide-react';

const VehicleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const vehicle = mockVehicles.find(v => v.id === id) || mockVehicles[6]; // Default to RS3

  const marketAvg = Math.round(vehicle.price * 1.08);
  const savings = marketAvg - vehicle.price;
  const gaugePosition = Math.max(10, Math.min(90, ((vehicle.price / marketAvg) * 100) - 10));

  return (
    <div className="min-h-screen bg-background font-display flex justify-center">
      <Helmet><title>{vehicle.title} | LaTruffe</title></Helmet>

      <div className="w-full max-w-md bg-background shadow-2xl relative min-h-screen pb-24">
        {/* Nav Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pt-6 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full h-80 bg-accent">
          <img
            src={vehicle.image_url || `https://placehold.co/600x400/e2e8f0/94a3b8?text=${vehicle.brand}`}
            alt={vehicle.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/94a3b8?text=${vehicle.brand}` }}
          />
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">1/12</div>
        </div>

        {/* Content */}
        <div className="relative -mt-6 bg-background rounded-t-DEFAULT px-6 pt-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
                    {vehicle.truffe_score >= 8.5 ? 'Great Deal' : 'Fair Price'}
                  </span>
                  {vehicle.is_verified && <span className="text-xs text-muted-foreground font-medium">Vendeur Pro</span>}
                </div>
                <h1 className="text-2xl font-bold leading-tight text-foreground">{vehicle.title}</h1>
                <p className="text-muted-foreground font-medium">{vehicle.brand} • {vehicle.year}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{vehicle.price.toLocaleString()} €</div>
                <div className="text-sm text-muted-foreground line-through">{marketAvg.toLocaleString()} €</div>
              </div>
            </div>

            {/* Specs Chips */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full border border-border whitespace-nowrap">
                <span className="text-sm font-medium">{(vehicle.mileage / 1000).toFixed(0)}k km</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full border border-border whitespace-nowrap">
                <span className="text-sm font-medium">{vehicle.fuel}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full border border-border whitespace-nowrap">
                <span className="text-sm font-medium">{vehicle.transmission}</span>
              </div>
            </div>
          </div>

          {/* AI Verdict */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white text-sm">✨</div>
                <h2 className="text-lg font-bold">LaTruffe AI Verdict</h2>
              </div>
              <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded">Score {vehicle.truffe_score}/10</span>
            </div>

            <div className="bg-card p-1 rounded-DEFAULT shadow-sm border border-border">
              {/* Pros */}
              <div className="p-4 bg-primary/5 rounded-DEFAULT mb-1">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Points forts
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-0.5 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                    <span className="text-sm text-muted-foreground leading-snug">Kilométrage <span className="font-semibold text-green-600">12% sous la moyenne</span> pour cette année-modèle.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-0.5 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                    <span className="text-sm text-muted-foreground leading-snug">Historique propre & véhicule première main.</span>
                  </li>
                </ul>
              </div>
              {/* Cons */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Points d'attention
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-orange-100 text-orange-600 rounded-full p-0.5 mt-0.5"><AlertTriangle className="w-3.5 h-3.5" /></span>
                    <span className="text-sm text-muted-foreground leading-snug">Approche de la révision majeure des 50k km.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Price Analysis */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Analyse de Prix</h2>
            <div className="bg-card p-6 rounded-DEFAULT shadow-sm border border-border">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Moyenne Marché</p>
                  <p className="text-xl font-bold text-foreground">{marketAvg.toLocaleString()} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Ce Véhicule</p>
                  <p className="text-xl font-bold text-primary">{vehicle.price.toLocaleString()} €</p>
                </div>
              </div>

              {/* Gauge */}
              <div className="relative h-4 bg-accent rounded-full w-full mb-2">
                <div className="absolute top-0 left-0 bottom-0 right-0 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 opacity-20" />
                <div className="absolute top-0 bottom-0 w-1 bg-muted-foreground rounded-full" style={{ left: '60%' }} />
                <div className="absolute -top-1.5 w-7 h-7 bg-card border-4 border-primary rounded-full shadow-lg transform -translate-x-1/2 flex items-center justify-center" style={{ left: `${gaugePosition}%` }}>
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2 px-1">
                <span>Bonne Affaire</span>
                <span>Correct</span>
                <span>Cher</span>
              </div>

              {savings > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-DEFAULT flex items-center gap-3">
                  <span className="text-green-600">💰</span>
                  <p className="text-sm text-green-800">Vous économisez <span className="font-bold">{savings.toLocaleString()} €</span> vs véhicules similaires.</p>
                </div>
              )}
            </div>
          </div>

          {/* Seller */}
          <div className="mb-24 pb-8 border-t border-border pt-6">
            <h2 className="text-lg font-bold mb-4">Vendeur</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-xl">🏪</div>
              <div>
                <h3 className="font-bold text-foreground">Prestige Motors</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">4.8 (124 avis)</span>
                </div>
              </div>
              <button className="ml-auto text-primary text-sm font-bold">Voir stock</button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-lg border-t border-border z-50 flex justify-center">
          <div className="w-full max-w-md flex gap-3">
            <button className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="flex-grow h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95">
              <MessageCircle className="w-5 h-5" /> Contacter le vendeur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
