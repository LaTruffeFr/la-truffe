import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn, ChevronDown, CheckCircle2, Star, ShieldCheck, 
  TrendingDown, Search, Eye, AlertTriangle, History, Euro, HelpCircle
} from 'lucide-react';
import { Footer, MobileNav } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER (Navigation Unifiée) --- */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoTruffe} alt="Logo La Truffe" className="h-10 w-10 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">La Truffe</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            
            <div className="relative group">
              <button className="flex items-center gap-1 text-primary font-semibold transition-colors focus:outline-none py-2">
                Rapports <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-60 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block p-1 animate-in fade-in zoom-in-95 duration-200">
                <Link to="/demo/demo-1" className="block px-4 py-2.5 hover:bg-slate-50 hover:text-primary rounded-lg">Exemple de rapport</Link>
                <Link to="/pricing" className="block px-4 py-2.5 font-medium bg-primary/5 text-primary hover:bg-primary/10 rounded-lg">Prix & Abonnements</Link>
                <div className="h-px bg-slate-100 my-1" />
                <Link to="/why-us" className="block px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg">Pourquoi nous choisir ?</Link>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none py-2">
                Entreprise <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block p-1 animate-in fade-in zoom-in-95 duration-200">
                <Link to="/qui-sommes-nous" className="block px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors">
                  Qui sommes-nous ?
                </Link>
                <Link to="/contact" className="block px-4 py-2.5 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button onClick={() => navigate('/auth')} variant="ghost" className="hidden md:flex hover:text-primary">Se connecter</Button>
            <Button onClick={() => navigate('/auth')} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Mon Espace</span>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden text-center">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            La méthode pas chère pour éviter les erreurs qui coûtent cher
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Un simple audit de prix aujourd'hui t'évite des mauvaises surprises demain – et t'aide à repérer les bonnes affaires immédiatement.
          </p>
        </div>
      </section>

      {/* --- PRICING CARDS --- */}
      <section className="py-16 bg-slate-50 -mt-10 rounded-t-[3rem] relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
            
            {/* CARD 3 RAPPORTS (Meilleure offre) */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-primary relative overflow-hidden order-1 md:order-2 transform md:-translate-y-6">
              <div className="bg-primary text-white text-center py-2 text-sm font-bold uppercase tracking-wider">
                Recommandé pour économiser
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Vérifier 3 voitures</h3>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">-40%</Badge>
                </div>
                <p className="text-slate-500 text-sm mb-6">Idéal pour comparer plusieurs annonces</p>
                
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">17,99 €</span>
                  <span className="text-sm text-slate-500 font-medium mb-1">/ rapport</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Prix total 53,97 € <span className="line-through">89,97 €</span></p>

                <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mb-4"
                onClick={() => navigate('/checkout?plan=3')}>
                  Acheter 3 rapports
                </Button>
                
                <p className="text-center text-xs text-slate-500 mb-6">Tu obtiendras 3 crédits valables 1 an</p>

                <ul className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Audit de prix complet</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Analyse courbe décote</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Aide à la négociation</li>
                </ul>
              </div>
            </div>

            {/* CARD 2 RAPPORTS */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 relative overflow-hidden order-2 md:order-1">
              <div className="bg-slate-100 text-slate-600 text-center py-2 text-sm font-bold uppercase tracking-wider">
                Populaire
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Vérifier 2 voitures</h3>
                  <Badge variant="outline" className="text-green-600 border-green-200">-33%</Badge>
                </div>
                <p className="text-slate-500 text-sm mb-6">Pour départager deux modèles</p>
                
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900">19,99 €</span>
                  <span className="text-sm text-slate-500 font-medium mb-1">/ rapport</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Prix total 39,98 € <span className="line-through">59,98 €</span></p>

                <Button variant="outline" className="w-full h-12 text-lg font-semibold border-slate-300 hover:bg-slate-50 mb-4"
                onClick={() => navigate('/checkout?plan=2')}>
                  Acheter 2 rapports
                </Button>
                
                <p className="text-center text-xs text-slate-500 mb-6">Tu obtiendras 2 crédits</p>

                <ul className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Audit de prix complet</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Analyse du marché</li>
                </ul>
              </div>
            </div>

            {/* CARD 1 RAPPORT */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 relative overflow-hidden order-3">
              <div className="bg-white text-white text-center py-2 text-sm font-bold uppercase tracking-wider">
                &nbsp;
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Vérifier 1 voiture</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Pour une vérification unique</p>
                
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900">29,99 €</span>
                  <span className="text-sm text-slate-500 font-medium mb-1">/ rapport</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Plein tarif</p>

                <Button variant="outline" className="w-full h-12 text-lg font-semibold border-slate-300 hover:bg-slate-50 mb-4"
                onClick={() => navigate('/checkout?plan=1')}>
                  Acheter 1 rapport
                </Button>
                
                <p className="text-center text-xs text-slate-500 mb-6">Tu obtiendras 1 crédit</p>

                <ul className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Audit de prix complet</li>
                </ul>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-8">
            <Link to="/enterprise" className="text-sm text-primary font-medium hover:underline">
              Afficher les tarifs pour les professionnels
            </Link>
            <p className="text-xs text-slate-400 mt-2">La TVA peut s'appliquer selon votre localisation.</p>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Découvre l’avis d’autres clients</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex justify-center mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-4 text-sm">
                "Après avoir utilisé La Truffe j'ai eu l'assurance que le véhicule que je convoitais était au bon prix et à un kilométrage cohérent. J'ai acheté 3 jours plus tard."
              </p>
              <div className="font-bold text-slate-900">Franck <span className="text-green-600 text-xs font-normal ml-2">Avis vérifié</span></div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex justify-center mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-4 text-sm">
                "Grâce à La Truffe je n'ai pas acheté le véhicule. Après avoir vu l'analyse de décote, j'ai changé d'avis quant à cet achat !!"
              </p>
              <div className="font-bold text-slate-900">Giles <span className="text-green-600 text-xs font-normal ml-2">Avis vérifié</span></div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex justify-center mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-4 text-sm">
                "C’est la première fois que j’utilise La Truffe et je suis très satisfait. Rapport simple et efficace."
              </p>
              <div className="font-bold text-slate-900">Housseyn <span className="text-green-600 text-xs font-normal ml-2">Avis vérifié</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- BENEFITS GRID (Achète malin) --- */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Achète malin</h2>
            <p className="text-slate-600 mt-2">Assure-toi que ton nouveau véhicule est un investissement sûr.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Évite de surpayer</h4>
                <p className="text-sm text-slate-600">Les données sur la valeur marchande moyenne t'aident à savoir si une voiture vaut son prix instantanément.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Vérifie le kilométrage</h4>
                <p className="text-sm text-slate-600">Nous analysons la cohérence du kilométrage par rapport à l'année et au prix pour détecter les anomalies.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Obtiens un aperçu clair</h4>
                <p className="text-sm text-slate-600">Personne n'aime les mauvaises surprises : visualisez la position du véhicule sur le marché global.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Détecte les anomalies</h4>
                <p className="text-sm text-slate-600">Un prix trop bas cache souvent quelque chose. Nos algos "Sniper" filtrent les offres suspectes.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Identifie les événements clés</h4>
                <p className="text-sm text-slate-600">La clarté est essentielle. Comprenez l'historique de prix du modèle pour acheter au bon moment.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Repère les dommages cachés</h4>
                <p className="text-sm text-slate-600">Reste informé si le prix reflète un véhicule accidenté ou en mauvais état.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DATA SOURCES INFO --- */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Nos données proviennent de plus de 900 sources</h2>
          <p className="text-slate-600 leading-relaxed">
            Nos rapports d'audit s'appuient sur des données provenant de plus de 900 bases de données internationales issues de registres d'annonces, de cotes officielles et d'autres institutions. Une fois que nous avons regroupé toutes les informations pertinentes, nous les organisons pour vous donner le "Juste Prix".
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 inline-block border border-slate-100">
            Chaque collecte de données a un coût technique, c'est pourquoi nos rapports approfondis ne sont pas gratuits.
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-primary" /> Questions fréquemment posées
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-slate-900 font-semibold text-left">Qu'est-ce qu'un audit La Truffe ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                C'est une analyse complète du marché pour un modèle donné. Nous comparons votre véhicule cible à des milliers d'autres pour déterminer s'il est vendu au juste prix.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-slate-900 font-semibold text-left">Quelles informations figurent dans un rapport ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Vous y trouverez le "Prix Truffe" (cote réelle), la courbe de décote, le classement de l'offre par rapport au marché (Sniper Chart), et une analyse des équipements.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-slate-900 font-semibold text-left">En quoi est-ce différent des cotes gratuites ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Les cotes gratuites sont souvent théoriques. La Truffe analyse le marché **réel** en temps réel, incluant les annonces actives et vendues récemment, pour une précision chirurgicale.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-slate-900 font-semibold text-left">Puis-je utiliser le rapport pour négocier ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Oui ! C'est un outil de négociation puissant. Montrer au vendeur que son véhicule est 2000€ au-dessus de la moyenne du marché est un argument factuel imparable.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-slate-900 font-semibold text-left">Quels modes de paiement acceptez-vous ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) ainsi que Apple Pay et Google Pay via notre plateforme sécurisée Stripe.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;