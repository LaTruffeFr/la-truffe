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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      
      <Header activeLink="pricing" />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-40 bg-gradient-to-b from-primary/5 to-background text-foreground overflow-hidden text-center border-b border-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 mb-8 rounded-full font-bold uppercase tracking-widest text-xs">
            Tarification Transparente
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
            Éviter une arnaque coûte <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">moins cher</span> qu'un café.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Notre algorithme d'expertise consomme des ressources pour scanner les vices cachés. Choisissez le pack de crédits adapté à votre recherche.
          </p>
        </div>
      </section>

      {/* --- PRICING CARDS --- */}
      <section className="relative z-20 -mt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* CARD 1 : PACK CURIEUX */}
            <div className="bg-card rounded-[2rem] shadow-xl dark:shadow-none border border-border relative overflow-hidden flex flex-col hover:border-primary/20 transition-colors">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border">
                  <Eye className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">Pack Curieux</h3>
                <p className="text-muted-foreground text-sm font-medium mb-8">Pour vérifier une voiture repérée ce matin.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-foreground">4,90€</span>
                  <span className="text-sm text-muted-foreground font-bold uppercase">/ unique</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-foreground/80 mb-8">
                  <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-primary" /> <span className="text-foreground font-black">3 Crédits d'Expertise</span> (3 URL)</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Déblocage du Playbook Négociation</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Devis chiffré des réparations</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto">
                <Button 
                  className="w-full h-14 text-lg font-black bg-muted hover:bg-accent text-foreground rounded-xl transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=curieux') : setShowBetaModal(true)}
                >
                  Sélectionner
                </Button>
              </div>
            </div>

            {/* CARD 2 : PACK CHASSEUR (BEST SELLER) */}
            <div className="bg-foreground dark:bg-accent rounded-[2rem] shadow-2xl border-2 border-primary relative overflow-hidden flex flex-col transform md:-translate-y-8">
              <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-2 text-xs font-black uppercase tracking-widest">
                Choix n°1 des acheteurs
              </div>
              <div className="p-8 pt-12 flex-1 relative z-10">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
                  <Target className="w-7 h-7 text-primary dark:text-primary" />
                </div>
                <h3 className="text-2xl font-black text-background dark:text-foreground mb-2">Pack Chasseur</h3>
                <p className="text-background/60 dark:text-muted-foreground text-sm font-medium mb-8">Pour ceux qui scrutent le marché tous les jours.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-background dark:text-foreground">9,90€</span>
                  <span className="text-sm text-background/50 dark:text-muted-foreground font-bold uppercase">/ unique</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-background/70 dark:text-foreground/70 mb-8">
                  <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-primary" /> <span className="text-background dark:text-foreground font-black">10 Crédits d'Expertise</span> (10 URL)</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Déblocage du Playbook Négociation</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Devis chiffré des réparations</li>
                  <li className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /> 1 Annonce Vendeur Premium incluse</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto relative z-10">
                <Button 
                  className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=chasseur') : setShowBetaModal(true)}
                >
                  Devenir Chasseur
                </Button>
              </div>
            </div>

            {/* CARD 3 : PACK VIP / PRO */}
            <div className="bg-card rounded-[2rem] shadow-xl dark:shadow-none border border-border relative overflow-hidden flex flex-col hover:border-border transition-colors">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-foreground dark:bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">Pass VIP Pro</h3>
                <p className="text-muted-foreground text-sm font-medium mb-8">Pour les marchands et merguezologues.</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-foreground">49€</span>
                  <span className="text-sm text-muted-foreground font-bold uppercase">/ mois</span>
                </div>

                <ul className="space-y-4 text-sm font-bold text-foreground/80 mb-8">
                  <li className="flex items-center gap-3"><Infinity className="w-5 h-5 text-primary" /> <span className="text-foreground font-black">Crédits Illimités</span></li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Accès Tour de Contrôle Admin</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Graphique Sniper + Imports CSV</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dépôts d'annonces illimités</li>
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto">
                <Button 
                  className="w-full h-14 text-lg font-black bg-foreground hover:bg-foreground/90 text-background rounded-xl transition-transform active:scale-95"
                  onClick={() => isVip ? navigate('/checkout?plan=vip') : setShowBetaModal(true)}
                >
                  Accès VIP
                </Button>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Paiements 100% sécurisés par Stripe. Sans engagement.
            </p>
          </div>
        </div>
      </section>

      {/* --- BENEFITS SECTION --- */}
      <section className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-foreground tracking-tight mb-4">Investissement immédiat</h2>
            <p className="text-muted-foreground text-lg font-medium">Ne payez plus jamais une voiture au-dessus de sa vraie valeur. Notre algorithme trouve la faille, vous négociez.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-muted/50 p-8 rounded-3xl border border-border hover:shadow-lg dark:hover:shadow-none transition-shadow">
              <div className="w-14 h-14 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6">
                <Euro className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-foreground mb-3">Devis Instantané</h4>
              <p className="text-muted-foreground font-medium leading-relaxed">Le vendeur dit "Rien à prévoir" ? Notre moteur d'analyse calcule immédiatement le coût des révisions oubliées (DSG, Pompe à eau, Distribution).</p>
            </div>

            <div className="bg-muted/50 p-8 rounded-3xl border border-border hover:shadow-lg dark:hover:shadow-none transition-shadow">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-foreground mb-3">Anti-Arnaque</h4>
              <p className="text-muted-foreground font-medium leading-relaxed">Nos algorithmes détectent les incohérences entre le kilométrage, l'année et le prix pour filtrer les compteurs trafiqués ou les épaves.</p>
            </div>

            <div className="bg-muted/50 p-8 rounded-3xl border border-border hover:shadow-lg dark:hover:shadow-none transition-shadow">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7" />
              </div>
              <h4 className="font-black text-xl text-foreground mb-3">Playbook Vendeur</h4>
              <p className="text-muted-foreground font-medium leading-relaxed">Vous ne savez pas comment négocier ? On vous génère un texte parfait avec les arguments précis à envoyer au vendeur par SMS.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-card rounded-2xl shadow-sm border border-border flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">Questions fréquentes</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-card rounded-[2rem] shadow-xl dark:shadow-none border border-border px-8 py-4">
            <AccordionItem value="item-1" className="border-b-border">
              <AccordionTrigger className="text-foreground font-black text-lg hover:text-primary transition-colors">Pourquoi ce n'est pas 100% gratuit ?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium text-base leading-relaxed">
                Notre technologie n'est pas une simple calculatrice. Elle interroge des bases de données de centaines de milliers de véhicules et utilise un algorithme d'analyse avancé propriétaire pour évaluer chaque option et chaque maladie moteur. Chaque scan nous coûte de l'argent en puissance de calcul.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b-border">
              <AccordionTrigger className="text-foreground font-black text-lg hover:text-primary transition-colors">Quels sites sont compatibles ?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium text-base leading-relaxed">
                Notre algorithme d'expertise est actuellement entraîné pour analyser les annonces de <strong>Leboncoin</strong> et <strong>La Centrale</strong>. De nouvelles plateformes seront ajoutées prochainement.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b-border">
              <AccordionTrigger className="text-foreground font-black text-lg hover:text-primary transition-colors">Les crédits ont-ils une date d'expiration ?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium text-base leading-relaxed">
                Non ! Que vous achetiez le Pack Curieux (3 crédits) ou Chasseur (10 crédits), vos jetons d'audit restent valables à vie sur votre compte, jusqu'à ce que vous trouviez la voiture de vos rêves.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-0">
              <AccordionTrigger className="text-foreground font-black text-lg hover:text-primary transition-colors">Comment fonctionne le paiement ?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium text-base leading-relaxed">
                Nous utilisons Stripe, le leader mondial du paiement en ligne. Vous pouvez payer par Carte Bancaire, Apple Pay ou Google Pay. Aucune donnée bancaire n'est stockée sur nos serveurs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />

      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Pricing;