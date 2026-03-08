import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Lock, Loader2, ShieldCheck, Star, CreditCard, Mail, CheckCircle2, Zap, Target, Infinity } from 'lucide-react';
import { Footer } from '@/components/landing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// IDs des prix Stripe (vrais price_id) - À METTRE À JOUR AVEC TES ID STRIPE
const PLANS: Record<string, { priceId: string; credits: number }> = {
  'curieux': { priceId: 'price_1T8gzGPpNQZ47toNJaEMNkL9', credits: 1 },
  'chasseur': { priceId: 'price_1T8gziPpNQZ47toNnH7WXUrx', credits: 3 },
  'vip': { priceId: 'price_1T8h0XPpNQZ47toNyg0eyJlh', credits: 10 },
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'chasseur';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const packs = {
    'curieux': { 
      id: 'curieux', 
      name: "Pack Curieux", 
      price: 4.90, 
      credits: "3 Crédits d'Expertise", 
      desc: "Idéal pour vérifier quelques annonces", 
      tag: null,
      icon: Zap,
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    },
    'chasseur': { 
      id: 'chasseur', 
      name: "Pack Chasseur", 
      price: 9.90, 
      credits: "10 Crédits IA", 
      desc: "Le choix des acheteurs actifs", 
      tag: "Recommandé",
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    'vip': { 
      id: 'vip', 
      name: "Pass VIP Pro", 
      price: 49.00, 
      credits: "Crédits Illimités", 
      desc: "Accès total (Facturation mensuelle)", 
      tag: "Pro",
      icon: Infinity,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
  };

  // @ts-ignore
  const selectedPack = packs[selectedPlanId] || packs['chasseur'];
  const plan = PLANS[selectedPlanId as keyof typeof PLANS];

  const handleCheckout = async () => {
    // Validation email pour les invités
    if (!user && !guestEmail) {
      toast({
        variant: "destructive",
        title: "Adresse Email requise",
        description: "Veuillez entrer votre email pour recevoir vos crédits.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan?.priceId,
          credits: plan?.credits,
          email: !user ? guestEmail : undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Ouvrir Stripe Checkout dans la même page (meilleure UX)
        window.location.href = data.url;
      } else {
        throw new Error("Aucune URL de paiement reçue");
      }
    } catch (error: any) {
      console.error('Erreur checkout:', error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter au serveur de paiement Stripe.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* HEADER ULTRA MINIMALISTE POUR MAXIMISER LA CONVERSION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <Link to="/" className="font-black text-2xl tracking-tighter text-slate-900 hover:opacity-80 transition-opacity">
            La Truffe
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-emerald-500" /> Checkout Sécurisé
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Button variant="ghost" className="mb-6 -ml-4 font-bold text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Modifier mon choix
        </Button>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* COLONNE GAUCHE (Sélection & Email) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* ÉTAPE 1 : SÉLECTEUR DE PACK */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black">1</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vérifiez votre sélection</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.values(packs).map((pack: any) => {
                  const isSelected = selectedPlanId === pack.id;
                  const Icon = pack.icon;
                  return (
                    <div 
                      key={pack.id}
                      onClick={() => setSelectedPlanId(pack.id)}
                      className={`relative cursor-pointer rounded-2xl p-5 transition-all duration-200 flex flex-col h-full
                        ${isSelected 
                          ? 'border-2 border-indigo-500 bg-white shadow-lg ring-4 ring-indigo-500/10' 
                          : 'border-2 border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
                        }`}
                    >
                      {pack.tag && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm
                          ${isSelected ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                          {pack.tag}
                        </div>
                      )}
                      
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3 ${isSelected ? pack.bg : 'bg-slate-50'}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? pack.color : 'text-slate-400'}`} />
                        </div>
                        <h3 className={`font-black mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{pack.name}</h3>
                        <div className="text-2xl font-black text-slate-900 mb-1">{pack.price.toFixed(2)} €</div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-md inline-block mx-auto mt-auto
                          ${isSelected ? pack.bg + ' ' + pack.color : 'bg-slate-100 text-slate-500'}`}>
                          {pack.credits}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ÉTAPE 2 : IDENTIFICATION */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black">2</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Où envoyer vos crédits ?</h2>
              </div>
              
              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8">
                  {user ? (
                    <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Connecté avec succès</p>
                        <p className="text-lg text-slate-900 font-black">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label htmlFor="guest-email" className="text-slate-700 font-bold text-base">
                        Adresse Email <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="jean.dupont@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="h-14 text-lg bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                        required
                      />
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" /> Vos crédits seront instantanément liés à cette adresse.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

          </div>

          {/* COLONNE DROITE (Récapitulatif & Paiement) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden">
                <div className="p-8 pb-6 border-b border-slate-800">
                  <h3 className="font-black text-xl mb-6">Récapitulatif de commande</h3>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg text-white">{selectedPack.name}</h4>
                      <p className="text-sm font-medium text-slate-400">{selectedPack.desc}</p>
                    </div>
                    <div className="text-xl font-bold text-white">{selectedPack.price.toFixed(2)} €</div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-medium text-slate-400 mt-4 mb-2">
                    <span>TVA (20%)</span>
                    <span>Inclus</span>
                  </div>
                </div>

                <div className="p-8 pt-6 bg-slate-900">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-lg font-medium text-slate-300">Total à payer</span>
                    <span className="text-4xl font-black text-white">{selectedPack.price.toFixed(2)} €</span>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={loading || (!user && !guestEmail)}
                    className="w-full h-16 text-lg font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Connexion sécurisée...</>
                    ) : (
                      <><Lock className="w-5 h-5 mr-3" /> Payer de manière sécurisée</>
                    )}
                  </Button>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Paiements Acceptés
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-xs font-bold text-slate-300 border border-white/5">CB</div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-xs font-bold text-slate-300 border border-white/5">Visa</div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-xs font-bold text-slate-300 border border-white/5">Mastercard</div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-xs font-bold text-slate-300 border border-white/5">Apple Pay</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-950 p-4 text-xs font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Chiffrement AES-256</div>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Garanti sans frais cachés</div>
                </div>
              </Card>

              <p className="text-center text-xs font-medium text-slate-500 max-w-sm mx-auto">
                En validant votre paiement, vous acceptez nos <Link to="/cgv" className="underline hover:text-slate-900">Conditions Générales de Vente</Link>. Vous recevrez une facture par email immédiatement après l'achat.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Checkout;
