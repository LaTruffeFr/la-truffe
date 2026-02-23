import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Target, TrendingDown, Link as LinkIcon, CheckCircle2, Euro, Award, 
  LineChart, Zap, Star, Loader2, Search, Shield, Users, Sparkles, BrainCircuit, Car, ArrowLeft
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { Header } from '@/components/Header';
import imgValeur from '@/assets/analyse-valeur.jpg'; 
import imgDecote from '@/assets/analyse-decote.jpg';

import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { useToast } from '@/hooks/use-toast';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';
import { BetaCounter } from '@/components/landing/BetaCounter';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVip } = useVipAccess();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || (!url.includes('leboncoin.fr') && !url.includes('lacentrale.fr'))) {
      toast({
        title: "URL invalide",
        description: "Veuillez coller un lien valide provenant de LeBonCoin ou LaCentrale.",
        variant: "destructive",
      });
      return;
    }

    if (!isVip) {
      setShowBetaModal(true);
      return;
    }

    if (!user) {
      sessionStorage.setItem('pendingUrlAudit', url.trim());
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      navigate(`/report/new?url=${encodeURIComponent(url.trim())}`);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", description: "Impossible de lancer l'analyse.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      <Helmet>
        <title>La Truffe | L'IA qui audite vos annonces auto & Marketplace experte</title>
        <meta name="description" content="Collez l'URL d'une annonce (LeBonCoin, LaCentrale) et laissez notre Cerveau Hybride l'analyser. Découvrez aussi notre Marketplace exclusive avec le top 1% des affaires." />
        <meta name="keywords" content="La Truffe | Vérifiez une Annonce Auto & Évitez les Arnaques, argus occasion, vérifier annonce voiture, arnaque leboncoin voiture, historique véhicule gratuit, estimation prix voiture" />
      </Helmet>
      
      <Header activeLink="home" />

      {/* --- HERO SECTION : L'AUDIT PAR URL --- */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
            <BrainCircuit className="w-4 h-4 mr-2 inline-block" /> Nouveau : Audit Hybride IA + Algo V11
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Collez une annonce auto.<br/><span className="text-primary">Notre IA vous dit si c'est une arnaque.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            LeBonCoin, LaCentrale... Ne vous fiez plus aux simples photos. Notre Cerveau Hybride lit la description, croise les prix du marché et génère vos arguments de négociation en 15 secondes.
          </p>

          <Card className="max-w-2xl mx-auto shadow-2xl border-0 ring-4 ring-primary/5 bg-white backdrop-blur-sm overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <Input 
                    type="url"
                    placeholder="https://www.leboncoin.fr/ad/voitures/..."
                    className="h-14 pl-12 text-base md:text-lg border-slate-200 focus:border-primary focus:ring-primary bg-slate-50 w-full rounded-xl"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyse...</> : 'Scanner l\'annonce'}
                </Button>
              </form>
              <div className="text-center mt-4">
                <Link to="/demo/demo-1" className="text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1">
                  <Search className="w-4 h-4" /> Voir un exemple de rapport
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12">
            <BetaCounter />
          </div>
        </div>
      </section>

      {/* --- MARKETPLACE SPOTLIGHT --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background décoratif */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">La seule Marketplace où <br/>les vendeurs ne peuvent pas tricher.</h2>
            <p className="text-lg text-slate-400">
              Pourquoi scroller pendant des heures sur des sites classiques ? Nous avons aspiré et pré-audité le marché pour vous. Seul le top 1% survit à nos algorithmes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-6">
                <Euro className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Classé par "Vraie" Rentabilité</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ici, pas d'annonces remontées parce que le vendeur a payé une option "En Tête". Les annonces sont strictement classées par écart de prix avec la cote réelle. La meilleure affaire est toujours en haut.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl transform md:-translate-y-4 shadow-2xl shadow-primary/10 border-t-primary/50">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                EXCLUSIF
              </div>
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">100% Pré-auditées</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Chaque véhicule présent sur notre marketplace a déjà subi le test de l'algorithme V11 et de notre IA. Les failles, les options cachées et les historiques douteux sont déjà filtrés.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Le Radar Sniper Inclus</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Visualisez chaque modèle sur un graphique interactif. Repérez la perle rare perdue au milieu des annonces trop chères en un seul coup d'œil.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-lg rounded-xl font-bold" onClick={() => navigate('/marketplace')}>
              Accéder à la Marketplace <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Adapté URL) --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
            <p className="text-slate-600">L'analyse automobile la plus avancée du marché, en 3 clics.</p>
          </div>

          <div className="space-y-12 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 md:before:left-1/2 md:before:-ml-px">
            {/* Step 1 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="md:text-right">
                <h3 className="text-xl font-bold text-slate-900 mb-2">1. Collez le lien de l'annonce</h3>
                <p className="text-slate-600 text-sm">Vous avez repéré une voiture sur LeBonCoin ou LaCentrale ? Copiez son URL et collez-la simplement dans notre barre de recherche.</p>
              </div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">1</div>
              <div className="hidden md:block"></div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="hidden md:block"></div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">2</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">2. L'IA lit entre les lignes</h3>
                <p className="text-slate-600 text-sm">Pendant 15 secondes, notre Cerveau Hybride aspire les données, repère les options cachées, et notre algorithme strict calcule sa rentabilité mathématique.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="md:text-right">
                <h3 className="text-xl font-bold text-slate-900 mb-2">3. Prenez l'avantage</h3>
                <p className="text-slate-600 text-sm">Obtenez votre rapport : prix juste, tags d'alerte, et des arguments générés par IA prêts à être copiés/collés pour négocier avec le vendeur.</p>
              </div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">3</div>
              <div className="hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HIDDEN TRUTH SECTION (Z-Pattern) --- */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ce que les simples annonces ne disent pas</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              La Truffe croise les données de milliers d'annonces similaires pour vous donner la tendance réelle.
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature Row 1: Prix Réel */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 order-2 md:order-1">
                <h3 className="text-2xl font-bold mb-4 text-white">Découvrez la vraie valeur</h3>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                  Le prix affiché n'est jamais le prix de vente final. Nous calculons le "Prix Truffe" idéal en fonction du kilométrage, des options et de la rareté du modèle sur le marché actuel.
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Prix de marché
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Prix recommandé
                  </div>
                </div>
              </div>
              {/* IMAGE 1 : ANALYSE VALEUR */}
              <div className="flex-1 order-1 md:order-2 rounded-3xl h-72 w-full overflow-hidden border border-slate-700 relative shadow-2xl group">
                <img 
                  src={imgValeur} 
                  alt="Analyse de la valeur réelle" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/FFF?text=Image+Valeur' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-6">
                   <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-slate-600/50 flex items-center gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg"><Euro className="w-6 h-6 text-blue-400" /></div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Analyse</p>
                        <p className="text-sm font-bold text-white">Valeur Réelle vs Affichée</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Feature Row 2: Décote & Kilométrage */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* IMAGE 2 : ANALYSE DÉCOTE */}
              <div className="flex-1 rounded-3xl h-72 w-full overflow-hidden border border-slate-700 relative shadow-2xl group">
                <img 
                  src={imgDecote} 
                  alt="Courbe de décote et dépréciation" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/FFF?text=Image+Decote' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-6">
                   <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-slate-600/50 flex items-center gap-3">
                      <div className="bg-green-500/20 p-2 rounded-lg"><LineChart className="w-6 h-6 text-green-400" /></div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">Projection</p>
                        <p className="text-sm font-bold text-white">Courbe de Décote Future</p>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-white">Anticipez la décote</h3>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                  Une voiture peut sembler pas chère, mais perdre 30% de sa valeur en un an. Nous analysons la courbe de décote pour vous dire si c'est un bon investissement à long terme.
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Courbe de valeur
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Coût par 10 000 km
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING (PACKS) --- */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Économisez des milliers d'euros pour le prix d'un café</h2>
            <p className="text-slate-600">Choisissez le pack adapté à votre recherche.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pack Découverte */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow relative">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Audit Unitaire</h3>
              <p className="text-slate-500 text-sm mb-6">Pour vérifier une voiture précise</p>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900">9,90 €</span>
              </div>
              <div className="text-sm text-slate-500 mb-8">
                Paiement unique
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1 Audit de marché complet</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Analyse du prix vs Marché</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Graphique "Sniper"</li>
              </ul>

              {isVip ? (
                <Button className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/checkout?pack=audit-unitaire')}>
                  Choisir ce pack
                </Button>
              ) : (
                <Button className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800" onClick={() => setShowBetaModal(true)}>
                  <Sparkles className="w-4 h-4 mr-2" /> Rejoindre la Bêta
                </Button>
              )}
            </div>

            {/* Pack Chasseur (Populaire) */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-primary relative transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                RECOMMANDÉ
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pack Chasseur</h3>
              <p className="text-slate-500 text-sm mb-6">Pour ceux qui cherchent la perle rare</p>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">24,90 €</span>
                <span className="text-slate-400 line-through text-sm">29,70 €</span>
              </div>
              <div className="text-sm text-green-600 font-semibold mb-8 bg-green-50 inline-block px-2 py-1 rounded">
                3 Audits Complets (8,30€ / audit)
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 3 Audits de marché</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Comparaison des cotes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Aide à la négociation</li>
              </ul>

              {isVip ? (
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => navigate('/checkout?pack=chasseur')}>
                  Choisir ce pack
                </Button>
              ) : (
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => setShowBetaModal(true)}>
                  <Sparkles className="w-4 h-4 mr-2" /> Rejoindre la Bêta
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS & TRUST --- */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">Des données massives pour une précision chirurgicale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-4xl font-extrabold text-blue-400 mb-2">10M+</div>
              <div className="text-slate-400 font-medium">Annonces analysées</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-extrabold text-red-400 mb-2">-15%</div>
              <div className="text-slate-400 font-medium">Économie moyenne constatée</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-extrabold text-orange-400 mb-2">98%</div>
              <div className="text-slate-400 font-medium">Précision de la cote</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Ils ont économisé avec La Truffe</h2>
            <p className="text-slate-600">Découvrez leurs histoires.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-700 mb-6 text-sm italic">
                "J'allais acheter une Golf 2000€ au-dessus du marché sans le savoir. La Truffe m'a montré les vrais prix, j'ai pu négocier instantanément."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">T</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Thomas</p>
                  <p className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Économie : 1800€</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-700 mb-6 text-sm italic">
                "Le graphique Sniper est génial. En un coup d'œil, j'ai vu que la voiture que je visais était une mauvaise affaire. J'ai trouvé mieux ailleurs."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">S</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Sophie</p>
                  <p className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Audit vérifié</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-700 mb-6 text-sm italic">
                "Indispensable pour un achat serein. Savoir que le prix est juste enlève tout le stress de la transaction."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">M</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Marc</p>
                  <p className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Audit vérifié</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Questions fréquemment posées</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-slate-900 font-semibold">Comment l'IA détecte-t-elle les arnaques ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Notre Cerveau Hybride combine la puissance d'un modèle d'Intelligence Artificielle pour la compréhension du langage naturel (détection de descriptions suspectes, mots-clés d'urgence) avec un algorithme mathématique strict (V11) qui vérifie les écarts de prix par rapport au marché réel.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-slate-900 font-semibold">Quels sites sont supportés ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Actuellement, notre analyse par URL fonctionne parfaitement avec les annonces provenant de LeBonCoin et LaCentrale.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-slate-900 font-semibold">Puis-je utiliser le rapport pour négocier ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Absolument ! Le rapport inclut une section "Arguments de négociation" générée sur-mesure pour votre annonce. Vous pouvez utiliser ces arguments directement par message ou par téléphone avec le vendeur pour justifier une baisse de prix.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Le juste prix de ta voiture t'attend</h2>
          <p className="text-xl text-slate-300 mb-10">
            Ne laissez plus le hasard (ou le vendeur) décider du prix. Prenez le contrôle.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white h-14 px-8 text-lg w-full sm:w-auto shadow-2xl" onClick={() => navigate('/demo/demo-1')}>
              Voir un exemple
            </Button>
            {isVip ? (
              <Button size="lg" variant="outline" className="text-slate-900 border-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg w-full sm:w-auto" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Lancer une analyse
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg w-full sm:w-auto" onClick={() => setShowBetaModal(true)}>
                <Sparkles className="w-5 h-5 mr-2" /> Rejoindre la Bêta
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* --- SEO CONTENT SECTION --- */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Une Cote Auto plus précise que l'Argus</h3>
              <p className="text-slate-600 leading-relaxed">
                Oubliez les grilles théoriques ! La Truffe scanne le marché réel en temps réel : Clio, Golf, 308, SUV premium... Nous analysons des milliers d'annonces actives pour vous donner le prix auquel les voitures se vendent vraiment, pas celui des catalogues.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Détectez les arnaques sur LeBonCoin</h3>
              <p className="text-slate-600 leading-relaxed">
                Un prix trop beau pour être vrai ? Notre IA analyse les signaux d'alerte : prix anormalement bas, descriptions suspectes, incohérences kilométrage/année. Protégez-vous des escroqueries avant même de contacter le vendeur.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Pour l'acheteur et le vendeur</h3>
              <p className="text-slate-600 leading-relaxed">
                Acheteur ? Négociez avec des données factuelles. Vendeur ? Prouvez la valeur de votre véhicule avec un rapport de marché professionnel. La Truffe est l'outil indispensable pour toute transaction automobile transparente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Landing;