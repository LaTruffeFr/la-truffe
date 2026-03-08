import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Star, ShieldCheck, 
  TrendingDown, Search, Eye, AlertTriangle, History, Euro, HelpCircle, Sparkles, Zap, Shield, Target, Infinity
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { Header } from '@/components/Header';
import { useVipAccess } from '@/hooks/useVipAccess';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';

const Pricing = () => {
  const navigate = useNavigate();
  const { isVip } = useVipAccess();
  const [showBetaModal, setShowBetaModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <Header activeLink="pricing" />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-40 bg-slate-900 text-white overflow-hidden text-center">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 mb-8 rounded-full font-bold uppercase tracking-widest text-xs">
            Tarification Transparente
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
            Éviter une arnaque coûte <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">moins cher</span> qu'un café.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Notre algorithme d'expertise consomme des ressources pour scanner les vices cachés. Choisissez le pack de crédits adapté à votre recherche.
          </p>
        </div>
      </section>

      {/* --- PRICING CARDS --- */}
      <section className="relative z-20 -mt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* CARD 1 : PACK CURIEUX */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 relative overflow-hidden flex flex-col hover:border-indigo-200 transition-colors">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
                  <Eye className="w-7 h-7 text-slate-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pack Curieux</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">Pour vérifier une voiture repérée ce matin.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-slate-900">4,90€</span>
                  <span className="text-sm text-slate-400 font-bold uppercase">/ unique</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-slate-700 mb-8">
                  <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-indigo-500" /> <span className="text-slate-900 font-black">3 Crédits d'Expertise</span> (3 URL)</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Déblocage du Playbook Négociation</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Devis chiffré des réparations</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto">
                <Button 
                  className="w-full h-14 text-lg font-black bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=curieux') : setShowBetaModal(true)}
                >
                  Sélectionner
                </Button>
              </div>
            </div>

            {/* CARD 2 : PACK CHASSEUR (BEST SELLER) */}
            <div className="bg-slate-900 rounded-[2rem] shadow-2xl border-2 border-indigo-500 relative overflow-hidden flex flex-col transform md:-translate-y-8">
              <div className="absolute top-0 inset-x-0 bg-indigo-500 text-white text-center py-2 text-xs font-black uppercase tracking-widest">
                Choix n°1 des acheteurs
              </div>
              <div className="p-8 pt-12 flex-1 relative z-10">
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                  <Target className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Pack Chasseur</h3>
                <p className="text-indigo-200 text-sm font-medium mb-8">Pour ceux qui scrutent le marché tous les jours.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-white">9,90€</span>
                  <span className="text-sm text-slate-400 font-bold uppercase">/ unique</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-slate-300 mb-8">
                  <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-indigo-400" /> <span className="text-white font-black">10 Crédits d'Expertise</span> (10 URL)</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Déblocage du Playbook Négociation</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Devis chiffré des réparations</li>
                  <li className="flex items-center gap-3"><Shield className="w-5 h-5 text-indigo-400" /> 1 Annonce Vendeur Premium incluse</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto relative z-10">
                <Button 
                  className="w-full h-14 text-lg font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=chasseur') : setShowBetaModal(true)}
                >
                  Devenir Chasseur
                </Button>
              </div>
            </div>

            {/* CARD 3 : PACK VIP / PRO */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 relative overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pass VIP Pro</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">Pour les marchands et merguezologues.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-slate-900">49€</span>
                  <span className="text-sm text-slate-400 font-bold uppercase">/ mois</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-slate-700 mb-8">
                  <li className="flex items-center gap-3"><Infinity className="w-5 h-5 text-indigo-500" /> <span className="text-slate-900 font-black">Crédits Illimités</span></li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Accès Tour de Contrôle Admin</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Graphique Sniper + Imports CSV</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dépôts d'annonces illimités</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto">
                <Button 
                  className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=vip') : setShowBetaModal(true)}
                >
                  Accès VIP
                </Button>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-slate-500 font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Paiements 100% sécurisés par Stripe. Sans engagement.
            </p>
          </div>
        </div>
      </section>

      {/* --- BENEFITS SECTION --- */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Investissement immédiat</h2>
            <p className="text-slate-500 text-lg font-medium">Ne payez plus jamais une voiture au-dessus de sa vraie valeur. Notre algorithme trouve la faille, vous négociez.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <Euro className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-slate-900 mb-3">Devis Instantané</h4>
              <p className="text-slate-600 font-medium leading-relaxed">Le vendeur dit "Rien à prévoir" ? Notre moteur d'analyse calcule immédiatement le coût des révisions oubliées (DSG, Pompe à eau, Distribution).</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-slate-900 mb-3">Anti-Arnaque</h4>
              <p className="text-slate-600 font-medium leading-relaxed">Nos algorithmes détectent les incohérences entre le kilométrage, l'année et le prix pour filtrer les compteurs trafiqués ou les épaves.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-slate-900 mb-3">Playbook Vendeur</h4>
              <p className="text-slate-600 font-medium leading-relaxed">Vous ne savez pas comment négocier ? On vous génère un texte parfait avec les arguments précis à envoyer au vendeur par SMS.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Questions fréquentes</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 px-8 py-4">
            <AccordionItem value="item-1" className="border-b-slate-100">
              <AccordionTrigger className="text-slate-900 font-black text-lg hover:text-indigo-600 transition-colors">Pourquoi ce n'est pas 100% gratuit ?</AccordionTrigger>
              <AccordionContent className="text-slate-600 font-medium text-base leading-relaxed">
                Notre technologie n'est pas une simple calculatrice. Elle interroge des bases de données de centaines de milliers de véhicules et utilise un algorithme d'analyse avancé propriétaire pour évaluer chaque option et chaque maladie moteur. Chaque scan nous coûte de l'argent en puissance de calcul.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b-slate-100">
              <AccordionTrigger className="text-slate-900 font-black text-lg hover:text-indigo-600 transition-colors">Quels sites sont compatibles ?</AccordionTrigger>
              <AccordionContent className="text-slate-600 font-medium text-base leading-relaxed">
                Notre algorithme d'expertise est actuellement entraîné pour analyser les annonces de <strong>Leboncoin</strong> et <strong>La Centrale</strong>. De nouvelles plateformes seront ajoutées prochainement.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b-slate-100">
              <AccordionTrigger className="text-slate-900 font-black text-lg hover:text-indigo-600 transition-colors">Les crédits ont-ils une date d'expiration ?</AccordionTrigger>
              <AccordionContent className="text-slate-600 font-medium text-base leading-relaxed">
                Non ! Que vous achetiez le Pack Curieux (3 crédits) ou Chasseur (10 crédits), vos jetons d'audit restent valables à vie sur votre compte, jusqu'à ce que vous trouviez la voiture de vos rêves.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-0">
              <AccordionTrigger className="text-slate-900 font-black text-lg hover:text-indigo-600 transition-colors">Comment fonctionne le paiement ?</AccordionTrigger>
              <AccordionContent className="text-slate-600 font-medium text-base leading-relaxed">
                Nous utilisons Stripe, le leader mondial du paiement en ligne. Vous pouvez payer par Carte Bancaire, Apple Pay ou Google Pay. Aucune donnée bancaire n'est stockée sur nos serveurs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />

      {/* Modale Bêta (Si l'utilisateur n'est pas VIP/Connecté) */}
      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Pricing;
