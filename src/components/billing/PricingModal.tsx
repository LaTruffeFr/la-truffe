import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, Loader2, Check, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    credits: 1,
    price: '4,90€',
    priceId: 'price_1T8gzGPpNQZ47toNJaEMNkL9',
    description: 'Idéal pour tester',
    features: ['1 audit complet', 'Rapport PDF', 'Score de confiance'],
    popular: false,
  },
  {
    id: 'chasseur',
    name: 'Chasseur',
    credits: 3,
    price: '9,90€',
    priceId: 'price_1T8gziPpNQZ47toNnH7WXUrx',
    description: 'Le plus populaire',
    features: ['3 audits complets', 'Rapport PDF', 'Score de confiance', 'Arguments de négo'],
    popular: true,
  },
  {
    id: 'marchand',
    name: 'Marchand',
    credits: 10,
    price: '24,90€',
    priceId: 'price_1T8h0XPpNQZ47toNyg0eyJlh',
    description: 'Pour les pros',
    features: ['10 audits complets', 'Rapport PDF', 'Score de confiance IA', 'Arguments de négo', 'Priorité d\'analyse'],
    popular: false,
  },
];

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingModal = ({ open, onOpenChange }: PricingModalProps) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (priceId: string, credits: number) => {
    setLoadingPlan(priceId);
    try {
      toast({ title: 'Redirection vers Stripe...', description: 'Vous allez être redirigé vers la page de paiement sécurisée.' });

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, credits },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('URL de paiement non reçue');

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Impossible de créer la session de paiement.',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 rounded-3xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 pt-8 pb-6 text-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <ScanSearch className="w-7 h-7 text-indigo-400" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              Rechargez votre flair 🐽
            </DialogTitle>
          </DialogHeader>
          <p className="text-indigo-200/70 text-sm mt-2">Achetez des crédits pour auditer des annonces avec l'IA La Truffe</p>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-lg hover:-translate-y-1 ${
                plan.popular
                  ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-bold px-3 py-1 text-xs shadow-lg">
                  <Zap className="w-3 h-3 mr-1" /> Best Seller
                </Badge>
              )}

              <div className="text-center mb-4 pt-2">
                <h3 className="font-black text-lg text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                </div>
                <p className="text-xs text-indigo-600 font-bold mt-1">
                  {plan.credits} {plan.credits > 1 ? 'audits' : 'audit'}
                </p>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleCheckout(plan.priceId, plan.credits)}
                disabled={!!loadingPlan}
                className={`w-full font-bold rounded-xl h-11 ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {loadingPlan === plan.priceId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Choisir cette offre'
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4 px-6">
          🔒 Paiement sécurisé par Stripe. Carte, Apple Pay, Google Pay, PayPal acceptés.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
