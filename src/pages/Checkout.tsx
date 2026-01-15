import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, ShieldCheck, CreditCard, CheckCircle2, 
  ArrowLeft, Star, ChevronDown, LogIn 
} from 'lucide-react';
import { Footer } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';

// Configuration des plans
const PLANS = {
  1: {
    id: 1,
    name: "Audit Unitaire",
    credits: 1,
    price: 29.99,
    originalPrice: 29.99,
    discount: 0,
    badge: null,
    features: ["1 Rapport complet", "Analyse Prix & Décote"]
  },
  2: {
    id: 2,
    name: "Pack Duo",
    credits: 2,
    price: 39.98,
    originalPrice: 59.98,
    discount: 33,
    badge: "Populaire",
    features: ["2 Rapports complets", "Idéal pour comparer"]
  },
  3: {
    id: 3,
    name: "Pack Chasseur",
    credits: 3,
    price: 53.97,
    originalPrice: 89.97,
    discount: 40,
    badge: "Meilleure Offre",
    features: ["3 Rapports complets", "Prix le plus bas (17,99€/u)"]
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // État du plan sélectionné (par défaut 3 si rien n'est spécifié)
  const [selectedPlanId, setSelectedPlanId] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer le plan depuis l'URL au chargement
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && PLANS[Number(planParam) as keyof typeof PLANS]) {
      setSelectedPlanId(Number(planParam));
    }
  }, [searchParams]);

  const selectedPlan = PLANS[selectedPlanId as keyof typeof PLANS];

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulation de paiement
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Paiement réussi !",
        description: `Vous avez acheté ${selectedPlan.credits} crédits d'audit.`,
      });
      // Redirection vers le dashboard après achat
      navigate('/client-dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER SIMPLIFIÉ (Rassurant pour le paiement) --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoTruffe} alt="Logo La Truffe" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-slate-900">La Truffe</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
            <Lock className="w-3 h-3" /> Paiement 100% Sécurisé
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* --- COLONNE GAUCHE : SÉLECTION & PAIEMENT --- */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Sélection de l'offre */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">1</span>
                Choisissez votre pack
              </h2>
              
              <RadioGroup 
                value={selectedPlanId.toString()} 
                onValueChange={(val) => setSelectedPlanId(Number(val))}
                className="grid gap-4"
              >
                {Object.values(PLANS).map((plan) => (
                  <div key={plan.id}>
                    <RadioGroupItem value={plan.id.toString()} id={`plan-${plan.id}`} className="peer sr-only" />
                    <Label
                      htmlFor={`plan-${plan.id}`}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50
                        ${selectedPlanId === plan.id 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'border-slate-200 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlanId === plan.id ? 'border-primary' : 'border-slate-300'}`}>
                          {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {plan.name}
                            {plan.badge && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {plan.features[0]} • {plan.features[1]}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-900">{plan.price.toFixed(2)} €</div>
                        {plan.discount > 0 && (
                          <div className="text-xs text-slate-400 line-through">{plan.originalPrice.toFixed(2)} €</div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </section>

            {/* 2. Formulaire de Paiement */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">2</span>
                Paiement sécurisé
              </h2>
              
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Carte Bancaire</CardTitle>
                    <div className="flex gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse e-mail</Label>
                      <Input id="email" type="email" placeholder="Pour recevoir votre rapport" required className="bg-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="card">Numéro de carte</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input id="card" placeholder="0000 0000 0000 0000" className="pl-10 font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiration</Label>
                        <Input id="expiry" placeholder="MM/AA" className="font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input id="cvc" placeholder="123" className="pl-9 font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" size="lg" className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg" disabled={isLoading}>
                        {isLoading ? "Traitement..." : `Payer ${selectedPlan.price.toFixed(2)} €`}
                      </Button>
                      <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Transaction chiffrée SSL 256-bit
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* --- COLONNE DROITE : RÉCAPITULATIF (Sticky) --- */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <Card className="border-slate-200 shadow-lg bg-white">
                <CardHeader className="bg-slate-900 text-white rounded-t-xl py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{selectedPlan.name}</h3>
                      <p className="text-sm text-slate-500">{selectedPlan.credits} crédits d'audit</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">{selectedPlan.price.toFixed(2)} €</div>
                      {selectedPlan.discount > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 mt-1">
                          -{selectedPlan.discount}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <ul className="space-y-3 mb-6">
                    {selectedPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      Accès immédiat
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      Valable 1 an
                    </li>
                  </ul>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      💡 <strong>Le saviez-vous ?</strong> Les utilisateurs qui achètent ce pack économisent en moyenne 1500€ sur leur achat automobile grâce à la négociation.
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Total à payer</span>
                    <span className="text-2xl font-bold text-slate-900">{selectedPlan.price.toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>

              {/* Témoignage rapide */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                  LC
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                  <p className="text-xs text-slate-600 italic">"Rapport reçu en 30 secondes. J'ai évité une voiture surcotée de 2000€. Merci !"</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">Lucie C.</p>
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