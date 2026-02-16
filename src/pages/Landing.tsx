import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppHeader } from '@/components/app/AppHeader';
import { mockVehicles } from '@/data/mockVehicles';
import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';
import { useTypewriter } from '@/hooks/useTypewriter';
import { BarChart3, Loader2 } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, credits, isAdmin, refreshCredits } = useAuth();
  const { isVip } = useVipAccess();
  const { toast } = useToast();
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [annee, setAnnee] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const shouldPauseTypewriter = focusedField !== null || marque !== '' || modele !== '';
  const typewriterText = useTypewriter(shouldPauseTypewriter);

  // Top 3 featured vehicles
  const featured = mockVehicles.filter(v => v.truffe_score >= 8.8).slice(0, 3);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marque.trim() || !modele.trim()) {
      toast({ title: "Champs requis", description: "Veuillez renseigner la marque et le modèle.", variant: "destructive" });
      return;
    }
    if (!isVip) { setShowBetaModal(true); return; }
    if (!user) {
      sessionStorage.setItem('pendingAudit', JSON.stringify({ marque: marque.trim(), modele: modele.trim() }));
      navigate('/auth');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({ user_id: user.id, marque: marque.trim(), modele: modele.trim(), status: 'pending' });
      if (error) throw error;
      toast({ title: "Demande envoyée !", description: "Votre demande d'audit VIP a été soumise." });
      navigate('/client-dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", description: "Impossible de soumettre votre demande.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 font-display text-foreground">
      <Helmet>
        <title>La Truffe | Analysez le marché auto & achetez au vrai prix</title>
        <meta name="description" content="Analysez n'importe quelle annonce auto. La Truffe détecte les arnaques, calcule la vraie cote du marché." />
      </Helmet>

      <AppHeader />

      <main className="px-6 flex flex-col gap-8 max-w-md mx-auto">
        {/* Hero */}
        <section className="mt-4">
          <h2 className="font-display text-4xl font-extrabold leading-[1.1] text-slate-900 mb-3">
            Ne surpayez plus <br />
            <span className="text-primary">votre voiture.</span>
          </h2>
          <p className="font-display text-muted-foreground text-lg leading-relaxed max-w-[80%]">
            Analyse de marché en temps réel pour l'acheteur malin.
          </p>
        </section>

        {/* Search Module */}
        <section className="bg-card rounded-DEFAULT p-5 shadow-soft border border-border">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            {/* Brand Select */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-muted-foreground">🚗</span>
              </div>
              <select
                value={marque}
                onChange={(e) => setMarque(e.target.value)}
                className="block w-full pl-12 pr-10 py-4 text-base border-none rounded-full bg-slate-50 text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="" disabled>Marque</option>
                <option value="Audi">Audi</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Renault">Renault</option>
                <option value="Peugeot">Peugeot</option>
                <option value="Volkswagen">Volkswagen</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-muted-foreground text-sm">▼</span>
              </div>
            </div>

            {/* Model & Year */}
            <div className="flex gap-3">
              <div className="relative w-1/2">
                <input
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                  placeholder={focusedField === 'modele' ? '' : typewriterText.model}
                  onFocus={() => setFocusedField('modele')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full px-5 py-4 text-base border-none rounded-full bg-slate-50 text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all shadow-sm placeholder:text-muted-foreground"
                />
              </div>
              <div className="relative w-1/2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-muted-foreground text-sm">📅</span>
                </div>
                <input
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  placeholder="Année"
                  className="block w-full pl-10 pr-5 py-4 text-base border-none rounded-full bg-slate-50 text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all shadow-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-muted-foreground">€</span>
              </div>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget max"
                className="block w-full pl-12 pr-5 py-4 text-base border-none rounded-full bg-slate-50 text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all shadow-sm placeholder:text-muted-foreground"
              />
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-primary hover:bg-blue-600 text-primary-foreground font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
              {isSubmitting ? 'Envoi...' : 'Analyser le marché'}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link to="/demo/demo-1" className="text-sm text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4 flex items-center justify-center gap-1">
              <BarChart3 className="w-4 h-4" /> Voir un exemple d'analyse
            </Link>
          </div>
        </section>

        {/* Featured Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-display font-bold text-xl text-slate-900">Opportunités du Jour</h3>
            <Link to="/client-dashboard" className="text-sm font-medium text-primary hover:text-blue-600 transition-colors">Voir tout</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-8 -mx-6 px-6 hide-scrollbar snap-x snap-mandatory">
            {featured.map((car) => (
              <div key={car.id} className="snap-center shrink-0 w-[280px] bg-card rounded-DEFAULT p-3 shadow-soft-hover transition-transform hover:-translate-y-1 relative group overflow-hidden">
                <div className="relative h-40 rounded-[0.75rem] overflow-hidden mb-3">
                  <img
                    src={car.image_url || `https://placehold.co/400x300/e2e8f0/94a3b8?text=${car.brand}`}
                    alt={car.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/94a3b8?text=${car.brand}` }}
                  />
                  <div className={`absolute top-2 left-2 ${car.truffe_score >= 9 ? 'bg-emerald-500/90' : 'bg-emerald-600/90'} backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
                    ✓ {car.truffe_score}/10
                  </div>
                </div>
                <div className="px-1">
                  <h4 className="font-bold text-slate-900 text-lg">{car.title}</h4>
                  <p className="text-xs text-muted-foreground">{car.year} • {car.mileage.toLocaleString()} km • {car.fuel}</p>
                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <p className="text-primary font-bold text-xl">{car.price.toLocaleString()} €</p>
                    </div>
                    {car.is_verified && (
                      <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        ⭐ Vendeur Pro
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Landing;
