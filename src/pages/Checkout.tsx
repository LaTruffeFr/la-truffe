import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Lock, Loader2, ShieldCheck, Star, CreditCard, Mail } from 'lucide-react';
import { Footer } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// IDs des prix Stripe - À remplacer par vos vrais price_id
const PRICE_IDS = {
  '1': 'price_1_audit',   // Remplacer par le vrai price_id
  '2': 'price_2_audits',  // Remplacer par le vrai price_id
  '3': 'price_3_audits',  // Remplacer par le vrai price_id
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || '1';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const packs = {
    '1': { id: '1', name: "Audit Unitaire", price: 9.90, credits: 1, desc: "Analyse complète pour 1 véhicule", tag: null },
    '2': { id: '2', name: "Pack Duo", price: 17.90, credits: 2, desc: "Idéal pour comparer deux modèles", tag: "Populaire" },
    '3': { id: '3', name: "Pack Chasseur", price: 24.90, credits: 3, desc: "Le choix des experts (Recommandé)", tag: "Meilleure offre" },
  };

  // @ts-ignore
  const selectedPack = packs[selectedPlanId] || packs['1'];
  const priceId = PRICE_IDS[selectedPlanId as keyof typeof PRICE_IDS];

  const handleCheckout = async () => {
    // Validation email pour les invités
    if (!user && !guestEmail) {
      toast({
        variant: "destructive",
        title: "Email requis",
        description: "Veuillez entrer votre email pour continuer.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          guestEmail: !user ? guestEmail : undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Ouvrir Stripe Checkout dans un nouvel onglet
        window.open(data.url, '_blank');
      } else {
        throw new Error("Aucune URL de paiement reçue");
      }
    } catch (error: any) {
      console.error('Erreur checkout:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du paiement.",
      });
    } finally {
      setLoading(false);
    }
  };

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

            {/* ZONE DE PAIEMENT */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Paiement sécurisé</h2>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  {/* Afficher l'email de l'utilisateur connecté ou demander un email */}
                  {user ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Mail className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">Connecté en tant que</p>
                        <p className="text-green-800 font-bold">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="guest-email" className="text-slate-700 font-medium">
                        Votre email
                      </Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-xs text-slate-500">
                        Vous recevrez votre rapport à cette adresse
                      </p>
                    </div>
                  )}

                  {/* Bouton de paiement */}
                  <Button 
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 gap-3"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Payer {selectedPack.price.toFixed(2)} €
                      </>
                    )}
                  </Button>

                  {/* Méthodes de paiement acceptées */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Paiements acceptés :</span>
                    <div className="flex gap-2">
                      <div className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">Visa</div>
                      <div className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">Mastercard</div>
                      <div className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">Apple Pay</div>
                      <div className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">Google Pay</div>
                    </div>
                  </div>
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