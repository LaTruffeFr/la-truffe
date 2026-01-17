import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Import crucial pour les crédits
import { ArrowLeft, Lock, Loader2, ShieldCheck, Star, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';

// ----------------------------------------------------------------------
// 1. CONFIGURATION (À MODIFIER AVEC TES INFOS)
// ----------------------------------------------------------------------

// 👇 METS TA CLÉ PUBLIQUE STRIPE ICI (pk_test_...)
const stripePromise = loadStripe("pk_test_51Sp4kbPpfbp0KU2MylVzZku0P8mnAS5OwvaSazTs0QwA08TpW5ZwaBSxY8oXNYfQFUgF98d8mA08EfC03RIo3in500t4uRSthx");

// 👇 METS TON URL CODESPACES DU PORT 8080 ICI (Sans le '/' à la fin)
const BACKEND_URL = "https://friendly-waffle-9q75555jprh7596-8080.app.github.dev"; 

// ----------------------------------------------------------------------
// 2. COMPOSANT FORMULAIRE INTERNE (Gère le paiement + crédits)
// ----------------------------------------------------------------------
const CheckoutForm = ({ amount, credits }: { amount: number, credits: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addCredits } = useAuth(); // Récupération de la fonction magique

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Demande à Stripe de valider le paiement
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirection de sécurité (si Stripe le demande impérativement)
        return_url: window.location.origin + "/client-dashboard",
      },
      redirect: 'if_required', // Important: permet de rester sur la page pour gérer les crédits en JS
    });

    if (error) {
      // ❌ Échec
      setErrorMessage(error.message || "Une erreur est survenue");
      toast({ variant: "destructive", title: "Paiement refusé", description: error.message });
      setIsProcessing(false);
    } else {
      // ✅ Succès
      addCredits(credits); // On ajoute les crédits au compte
      
      toast({ 
        title: "Paiement Validé ! 🎉", 
        description: `${credits} crédits ont été ajoutés à votre compte.` 
      });
      
      // Petite pause pour laisser l'utilisateur voir le succès
      setTimeout(() => {
        navigate('/client-dashboard');
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-1">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      <Button 
        disabled={!stripe || isProcessing} 
        className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 mt-4 shadow-lg transition-all hover:scale-[1.01]"
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 animate-spin" /> Validation...</>
        ) : (
          `Payer ${amount.toFixed(2)} €`
        )}
      </Button>
      
      <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1 mt-2">
        <Lock className="w-3 h-3" /> Transaction chiffrée SSL 256-bits
      </p>
    </form>
  );
};

// ----------------------------------------------------------------------
// 3. PAGE PRINCIPALE (Choix du pack + Layout)
// ----------------------------------------------------------------------
const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const initialPlan = searchParams.get('plan') || '1';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [clientSecret, setClientSecret] = useState("");
  const [loadingSecret, setLoadingSecret] = useState(false);

  // Définition des packs
  const packs: any = {
    '1': { id: '1', name: "Audit Unitaire", price: 9.90, credits: 1, desc: "Analyse complète pour 1 véhicule", tag: null },
    '2': { id: '2', name: "Pack Duo", price: 17.90, credits: 2, desc: "Idéal pour comparer deux modèles", tag: "Populaire" },
    '3': { id: '3', name: "Pack Chasseur", price: 24.90, credits: 3, desc: "Le choix des experts (Recommandé)", tag: "Meilleure offre" },
  };

  const selectedPack = packs[selectedPlanId] || packs['1'];

  // Récupération du ClientSecret auprès du Backend quand on change de pack
  useEffect(() => {
    setSearchParams({ plan: selectedPlanId });
    setLoadingSecret(true);
    setClientSecret(""); 

    fetch(`${BACKEND_URL}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: selectedPack.price }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoadingSecret(false);
      })
      .catch((err) => {
        console.error("Erreur Backend:", err);
        setLoadingSecret(false);
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Impossible de joindre le serveur de paiement. Vérifiez que le port 8080 est Public.",
        });
      });
  }, [selectedPlanId, setSearchParams]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* HEADER SIMPLE */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoTruffe} alt="Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold">La Truffe</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Paiement Sécurisé
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* GAUCHE : SÉLECTION + PAIEMENT */}
          <div className="md:col-span-7 space-y-8">
            
            {/* SÉLECTEUR DE PACK */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Votre offre</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.values(packs).map((pack: any) => (
                  <div 
                    key={pack.id}
                    onClick={() => setSelectedPlanId(pack.id)}
                    className={`
                      relative cursor-pointer rounded-xl border-2 p-4 transition-all
                      ${selectedPlanId === pack.id 
                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary' 
                        : 'border-slate-200 bg-white hover:border-slate-300'}
                    `}
                  >
                    {pack.tag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {pack.tag}
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className={`font-bold ${selectedPlanId === pack.id ? 'text-primary' : 'text-slate-900'}`}>{pack.name}</h3>
                      <div className="text-xl font-bold my-2">{pack.price} €</div>
                      <div className="text-xs text-slate-500">{pack.credits} Crédit{pack.credits > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ZONE PAIEMENT */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Paiement par carte</h2>
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {clientSecret && !loadingSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                      {/* On passe le montant ET le nombre de crédits au formulaire */}
                      <CheckoutForm amount={selectedPack.price} credits={selectedPack.credits} />
                    </Elements>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm">Sécurisation de la connexion bancaire...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* DROITE : RÉCAPITULATIF */}
          <div className="md:col-span-5">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                {/* Effet visuel background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                    <div>
                      <h3 className="font-bold text-lg">{selectedPack.name}</h3>
                      <p className="text-sm text-slate-400">{selectedPack.desc}</p>
                    </div>
                    <div className="text-xl font-bold">{selectedPack.price.toFixed(2)} €</div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between">
                      <span>Sous-total HT</span>
                      <span>{(selectedPack.price / 1.2).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (20%)</span>
                      <span>{(selectedPack.price - (selectedPack.price / 1.2)).toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xl font-bold pt-4 border-t border-slate-700">
                    <span>Total TTC</span>
                    <span>{selectedPack.price.toFixed(2)} €</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-800/50 p-4 text-xs text-slate-400 flex flex-col gap-2 rounded-b-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Garantie "Satisfait ou Remboursé"
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" /> Support client prioritaire inclus
                  </div>
                </CardFooter>
              </Card>

              {/* Témoignage rassurant */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 opacity-90">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">A</div>
                <div>
                  <div className="flex text-yellow-400 text-xs mb-1">★★★★★</div>
                  <p className="text-xs text-slate-600 italic">"J'ai reçu mon analyse instantanément après le paiement. Très pro." - Arnaud</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;