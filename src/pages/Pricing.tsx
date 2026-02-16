import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useVipAccess } from '@/hooks/useVipAccess';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';

const Pricing = () => {
  const navigate = useNavigate();
  const { isVip } = useVipAccess();
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const handleCTA = (plan: string) => {
    if (isVip) navigate(`/checkout?plan=${plan}`);
    else setShowBetaModal(true);
  };

  return (
    <div className="min-h-screen bg-background font-display text-foreground">
      <Helmet><title>Nos Offres | LaTruffe</title></Helmet>

      <div className="max-w-md mx-auto min-h-screen relative pb-10 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Nos Offres</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 px-5 pt-2 flex flex-col gap-6">
          {/* Hero */}
          <div className="text-center space-y-2 mb-2">
            <h2 className="text-3xl font-extrabold text-foreground">Choisissez votre plan</h2>
            <p className="text-muted-foreground text-sm">Débloquez la puissance de l'analyse automobile.</p>
          </div>

          {/* Billing Toggle */}
          <div className="bg-card p-1.5 rounded-full flex relative shadow-sm mx-4 mb-4 border border-border">
            <div className={`w-1/2 h-full absolute left-1.5 top-1.5 bottom-1.5 bg-primary rounded-full shadow-sm transition-transform duration-300 ease-out z-0 ${
              billing === 'annual' ? 'translate-x-full' : ''
            }`} />
            <button onClick={() => setBilling('monthly')} className={`relative z-10 w-1/2 py-2 text-sm font-semibold text-center ${billing === 'monthly' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>
              Mensuel
            </button>
            <button onClick={() => setBilling('annual')} className={`relative z-10 w-1/2 py-2 text-sm font-semibold text-center ${billing === 'annual' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>
              Annuel <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1 font-bold">-20%</span>
            </button>
          </div>

          {/* Card 1: Gratuit */}
          <div className="bg-card rounded-DEFAULT p-6 shadow-corporate border border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Gratuit</h3>
                <p className="text-xs text-muted-foreground mt-1">Pour les curieux du marché.</p>
              </div>
              <div className="bg-accent p-2 rounded-full">🚗</div>
            </div>
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-foreground">0€</span>
              <span className="text-muted-foreground ml-1 font-medium">/mois</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5" /><span className="text-sm text-muted-foreground">Tendances de marché basiques</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5" /><span className="text-sm text-muted-foreground">1 alerte véhicule active</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5" /><span className="text-sm text-muted-foreground">Résumé quotidien par email</span></li>
            </ul>
            <button onClick={() => handleCTA('free')} className="w-full py-3.5 rounded-full border-2 border-border text-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors">
              S'inscrire
            </button>
          </div>

          {/* Card 2: Pack Chasseur (Highlighted) */}
          <div className="relative transform scale-105 z-10">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-primary to-blue-400 rounded-DEFAULT blur opacity-30" />
            <div className="relative bg-primary text-primary-foreground rounded-DEFAULT p-7 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-4 right-4">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm">Populaire</span>
              </div>
              <div className="mb-5">
                <h3 className="text-2xl font-bold">Pack Chasseur</h3>
                <p className="text-blue-100 text-sm mt-1">Pour les acheteurs actifs.</p>
              </div>
              <div className="mb-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight">{billing === 'monthly' ? '29€' : '23€'}</span>
                <span className="text-blue-100 ml-1 font-medium">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Alertes en temps réel', 'Outils d\'évaluation avancés', '50 rapports d\'historique', 'Support prioritaire'].map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="bg-white text-primary rounded-full p-0.5 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                    <span className="text-sm font-medium text-white">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleCTA('chasseur')} className="w-full py-4 rounded-full bg-white text-primary font-bold text-base shadow-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Commencer <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-blue-200 mt-4 opacity-80">Annulable à tout moment.</p>
            </div>
          </div>

          {/* Card 3: Pack Pro */}
          <div className="bg-card rounded-DEFAULT p-6 shadow-corporate border border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Pack Pro</h3>
                <p className="text-xs text-muted-foreground mt-1">Pour les concessionnaires.</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full text-primary">🏢</div>
            </div>
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-foreground">{billing === 'monthly' ? '99€' : '79€'}</span>
              <span className="text-muted-foreground ml-1 font-medium">/mois</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Tout du Pack Chasseur', 'Accès API complet', 'Rapports illimités', 'Export CSV & Gestion d\'équipe'].map(f => (
                <li key={f} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5" /><span className="text-sm text-muted-foreground">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => handleCTA('pro')} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-corporate-md hover:bg-primary/90 transition-colors">
              Devenir Pro
            </button>
          </div>

          {/* Footer Trust */}
          <div className="mt-4 pb-8 flex flex-col items-center space-y-4 text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ils nous font confiance</p>
            <div className="flex gap-4 opacity-50 grayscale">
              <div className="h-6 w-16 bg-slate-300 rounded" />
              <div className="h-6 w-16 bg-slate-300 rounded" />
              <div className="h-6 w-16 bg-slate-300 rounded" />
            </div>
            <Link to="/enterprise" className="text-sm text-primary font-semibold hover:underline">
              Besoin d'une offre Enterprise ?
            </Link>
          </div>
        </main>
      </div>

      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Pricing;
