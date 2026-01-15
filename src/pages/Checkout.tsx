import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Lock, Loader2, ShieldCheck, Star } from 'lucide-react';
import { Footer } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';

// --- CONFIGURATION STRIPE ---
// Remplace ceci par ta Clé Publique Stripe (pk_test_...)
const stripePromise = loadStripe("pk_test_51Sp4kbPpfbp0KU2MylVzZku0P8mnAS5OwvaSazTs0QwA08TpW5ZwaBSxY8oXNYfQFUgF98d8mA08EfC03RIo3in500t4uRSthx");

// Composant interne pour le formulaire Stripe
const StripeForm = ({ amount, onSuccess }: { amount: number, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirection après paiement (optionnel si tu gères tout en JS)
        return_url: window.location.origin + "/client-dashboard",
      },
      redirect: 'if_required' // Empêche la redirection si pas nécessaire (ex: CB simple)
    });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button disabled={!stripe || loading} className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 mt-4">
        {loading ? <Loader2 className="animate-spin" /> : `Payer ${amount.toFixed(2)} €`}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || '1';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [clientSecret, setClientSecret] = useState("");

  const packs = {
    '1': { id: '1', name: "Audit Unitaire", price: 9.90, credits: 1, desc: "Analyse complète pour 1 véhicule", tag: null },
    '2': { id: '2', name: "Pack Duo", price: 17.90, credits: 2, desc: "Idéal pour comparer deux modèles", tag: "Populaire" },
    '3': { id: '3', name: "Pack Chasseur", price: 24.90, credits: 3, desc: "Le choix des experts (Recommandé)", tag: "Meilleure offre" },
  };

  // @ts-ignore
  const selectedPack = packs[selectedPlanId] || packs['1'];

  useEffect(() => {
    setSearchParams({ plan: selectedPlanId });

    // Appel au Backend pour créer l'intention de paiement
    fetch("https://cautious-space-engine-5gj66pppr4w627jwx-8080.app.github.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: selectedPack.price }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [selectedPlanId]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoTruffe} alt="Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold">La Truffe</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Paiement Sécurisé Stripe
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            {/* SÉLECTEUR DE PACK */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Choisissez votre pack</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.values(packs).map((pack: any) => (
                  <div 
                    key={pack.id}
                    onClick={() => setSelectedPlanId(pack.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedPlanId === pack.id ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    {pack.tag && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{pack.tag}</div>}
                    <div className="text-center">
                      <h3 className={`font-bold ${selectedPlanId === pack.id ? 'text-primary' : 'text-slate-900'}`}>{pack.name}</h3>
                      <div className="text-xl font-bold my-2">{pack.price} €</div>
                      <div className="text-xs text-slate-500">{pack.credits} Crédits</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ZONE DE PAIEMENT STRIPE */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Paiement sécurisé</h2>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                      <StripeForm 
                        amount={selectedPack.price} 
                        onSuccess={() => navigate('/client-dashboard')} 
                      />
                    </Elements>
                  ) : (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* RÉCAPITULATIF À DROITE */}
          <div className="md:col-span-5">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                    <div>
                      <h3 className="font-bold text-lg">{selectedPack.name}</h3>
                      <p className="text-sm text-slate-400">{selectedPack.desc}</p>
                    </div>
                    <div className="text-xl font-bold">{selectedPack.price.toFixed(2)} €</div>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span>Total à payer</span>
                    <span>{selectedPack.price.toFixed(2)} €</span>
                  </div>
                </CardContent>
                <CardContent className="bg-slate-800/50 p-4 text-xs text-slate-400 flex flex-col gap-2 rounded-b-xl">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" /> Paiement sécurisé par Stripe</div>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> 4.9/5 par nos clients</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;