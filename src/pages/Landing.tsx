import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  Target, TrendingDown, 
  BarChart3, CheckCircle2, Euro, Award, 
  LineChart, Zap, Star, Loader2, Search, Shield, Users, Sparkles
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { Header } from '@/components/Header';
import imgValeur from '@/assets/analyse-valeur.jpg'; 
import imgDecote from '@/assets/analyse-decote.jpg';

import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';
import { useTypewriter } from '@/hooks/useTypewriter';
import { BetaCounter } from '@/components/landing/BetaCounter';

const Landing = () => {
  const navigate = useNavigate();
  const { user, credits, isAdmin, refreshCredits } = useAuth();
  const { isVip } = useVipAccess();
  const { toast } = useToast();
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [precision, setPrecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Typewriter animation - pause when any field is focused or has content
  const shouldPauseTypewriter = focusedField !== null || marque !== '' || modele !== '' || precision !== '';
  const typewriterText = useTypewriter(shouldPauseTypewriter);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!marque.trim() || !modele.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner la marque et le modèle.",
        variant: "destructive",
      });
      return;
    }

    // Si non VIP, afficher la modale Bêta
    if (!isVip) {
      setShowBetaModal(true);
      return;
    }

    // Si non connecté (mais VIP via URL), rediriger vers auth
    if (!user) {
      sessionStorage.setItem('pendingAudit', JSON.stringify({ marque: marque.trim(), modele: modele.trim() }));
      navigate('/auth');
      return;
    }

    // Pour les VIP, pas besoin de vérifier les crédits

    // Si connecté, créer la demande
    setIsSubmitting(true);
    try {
      // Créer le rapport
      const { error: reportError } = await supabase.from('reports').insert({
        user_id: user.id,
        marque: marque.trim(),
        modele: modele.trim(),
        status: 'pending',
      });

      if (reportError) throw reportError;

      // Pour les VIP, pas de déduction de crédit
      // Les admins et VIP ne paient pas
      toast({
        title: "Demande envoyée !",
        description: "Votre demande d'audit VIP a été soumise. Traitement prioritaire.",
      });

      // Rediriger vers le dashboard client
      navigate('/client-dashboard');
    } catch (error) {
      console.error('Error creating report request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre demande. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      <Helmet>
        <title>La Truffe | Vérifiez une Annonce Auto & Évitez les Arnaques & Analyse d'Annonces Occasion</title>
        <meta name="description" content="Analysez n'importe quelle annonce auto (LeBonCoin, LaCentrale). La Truffe détecte les arnaques, calcule la vraie cote du marché et vérifie la fiabilité pour tous les véhicules." />
        <meta name="keywords" content="La Truffe | Vérifiez une Annonce Auto & Évitez les Arnaques, argus occasion, vérifier annonce voiture, arnaque leboncoin voiture, historique véhicule gratuit, estimation prix voiture" />
        <meta property="og:title" content="La Truffe | Vérifiez une Annonce Auto & Évitez les Arnaques & Analyse d'Annonces Occasion" />
        <meta property="og:description" content="Analysez n'importe quelle annonce auto (LeBonCoin, LaCentrale). La Truffe détecte les arnaques, calcule la vraie cote du marché et vérifie la fiabilité pour tous les véhicules." />
        <meta name="twitter:title" content="La Truffe | Vérifiez une Annonce Auto & Évitez les Arnaques & Analyse d'Annonces Occasion" />
        <meta name="twitter:description" content="Analysez n'importe quelle annonce auto (LeBonCoin, LaCentrale). La Truffe détecte les arnaques, calcule la vraie cote du marché et vérifie la fiabilité pour tous les véhicules." />
      </Helmet>
      
      <Header activeLink="home" />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="container mx-auto px-4 text-center max-w-5xl relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Analysez le marché, <br/><span className="text-primary">achetez au vrai prix.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Ne surpayez plus votre future voiture. La Truffe analyse des milliers d'annonces en temps réel pour vous dire si c'est une bonne affaire... ou pas.
          </p>

          <Card className="max-w-3xl mx-auto shadow-2xl border-0 ring-1 ring-black/5 bg-white backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block ml-1">Marque</label>
                  <Input 
                    placeholder={focusedField === 'marque' ? '' : typewriterText.make}
                    className="h-12 text-lg border-slate-200 focus:border-primary focus:ring-primary bg-slate-50"
                    value={marque}
                    onChange={(e) => setMarque(e.target.value)}
                    onFocus={() => setFocusedField('marque')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block ml-1">Modèle</label>
                  <Input 
                    placeholder={focusedField === 'modele' ? '' : typewriterText.model}
                    className="h-12 text-lg border-slate-200 focus:border-primary focus:ring-primary bg-slate-50"
                    value={modele}
                    onChange={(e) => setModele(e.target.value)}
                    onFocus={() => setFocusedField('modele')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block ml-1">Précision (Optionnel)</label>
                  <Input 
                    placeholder={focusedField === 'precision' ? '' : typewriterText.precision}
                    className="h-12 text-lg border-slate-200 focus:border-primary focus:ring-primary bg-slate-50"
                    value={precision}
                    onChange={(e) => setPrecision(e.target.value)}
                    onFocus={() => setFocusedField('precision')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-12 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Envoi...</>
                  ) : (
                    'Demander un audit'
                  )}
                </Button>
              </form>
              
              <div className="text-center mt-4">
                <Link to="/demo/demo-1" className="text-sm text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4 flex items-center justify-center gap-1">
                  <LineChart className="w-4 h-4" /> Voir un exemple d'analyse de marché
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Beta Counter */}
          <div className="mt-10">
            <BetaCounter />
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-slate-200/60">
            <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">Ce que nos algorithmes analysent :</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-700 font-medium text-sm">
              <div className="flex items-center justify-center gap-2"><Target className="w-5 h-5 text-blue-500" /> Prix du marché</div>
              <div className="flex items-center justify-center gap-2"><TrendingDown className="w-5 h-5 text-green-500" /> Décote réelle</div>
              <div className="flex items-center justify-center gap-2"><BarChart3 className="w-5 h-5 text-purple-500" /> Tendance (Hausse/Baisse)</div>
              <div className="flex items-center justify-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Opportunités en or</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY SMART BUYERS CHOOSE US --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Pourquoi utiliser La Truffe ?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              L'audit de prix est votre meilleure arme pour négocier ou confirmer une bonne affaire.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100 transition-all duration-300">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Euro className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Ne perdez plus d'argent</h3>
              <p className="text-slate-600 leading-relaxed">
                Acheter au-dessus du marché, c'est perdre de l'argent dès le premier jour. Nous vous disons exactement ce que vaut le véhicule.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Ciblez les vraies affaires</h3>
              <p className="text-slate-600 leading-relaxed">
                Nos algorithmes "Sniper" isolent les annonces qui sont réellement sous la cote, en excluant les arnaques potentielles.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Négociez comme un pro</h3>
              <p className="text-slate-600 leading-relaxed">
                Arrivez devant le vendeur avec un rapport de marché complet. Prouvez-lui que son prix est trop élevé avec des données factuelles.
              </p>
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

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Comment ça marche ?</h2>
            <p className="text-slate-600">Une analyse complexe rendue simple pour vous.</p>
          </div>

          <div className="space-y-12 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 md:before:left-1/2 md:before:-ml-px">
            {/* Step 1 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="md:text-right">
                <h3 className="text-xl font-bold text-slate-900 mb-2">1. Définissez le véhicule</h3>
                <p className="text-slate-600 text-sm">Entrez la Marque, le Modèle et idéalement l'Année ou la Finition pour une précision maximale.</p>
              </div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">1</div>
              <div className="hidden md:block"></div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="hidden md:block"></div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">2</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nos algorithmes scannent le marché</h3>
                <p className="text-slate-600 text-sm">Nous analysons instantanément toutes les annonces comparables en France et en Europe.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-20 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="md:text-right">
                <h3 className="text-xl font-bold text-slate-900 mb-2">3. Obtenez votre "Sniper Score"</h3>
                <p className="text-slate-600 text-sm">Visualisez immédiatement si le véhicule est une bonne affaire (Zone Verte) ou trop cher (Zone Rouge).</p>
              </div>
              <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-bold text-xl text-primary md:left-1/2 md:-ml-7 z-10 shadow-sm">3</div>
              <div className="hidden md:block"></div>
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
            {/* Review 1 */}
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

            {/* Review 2 */}
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

            {/* Review 3 */}
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
              <AccordionTrigger className="text-slate-900 font-semibold">Comment La Truffe calcule le bon prix ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Nous agrégeons en temps réel toutes les annonces disponibles pour le même modèle, même année, même motorisation. Nous appliquons ensuite des corrections statistiques pour exclure les valeurs aberrantes et vous donner la vraie tendance du marché.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-slate-900 font-semibold">Est-ce que ça marche pour toutes les voitures ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Oui, tant qu'il y a suffisamment d'annonces sur le marché pour établir une statistique fiable (généralement au moins 5 à 10 annonces similaires en Europe).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-slate-900 font-semibold">Puis-je utiliser le rapport pour négocier ?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Absolument ! C'est même le but principal. Imprimez le rapport ou montrez-le sur votre téléphone au vendeur pour prouver que son prix est au-dessus du marché.
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
            {/* Col 1 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Une Cote Auto plus précise que l'Argus</h3>
              <p className="text-slate-600 leading-relaxed">
                Oubliez les grilles théoriques ! La Truffe scanne le marché réel en temps réel : Clio, Golf, 308, SUV premium... Nous analysons des milliers d'annonces actives pour vous donner le prix auquel les voitures se vendent vraiment, pas celui des catalogues.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Détectez les arnaques sur LeBonCoin</h3>
              <p className="text-slate-600 leading-relaxed">
                Un prix trop beau pour être vrai ? Notre IA analyse les signaux d'alerte : prix anormalement bas, descriptions suspectes, incohérences kilométrage/année. Protégez-vous des escroqueries avant même de contacter le vendeur.
              </p>
            </div>

            {/* Col 3 */}
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

      {/* Modale Bêta */}
      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
};

export default Landing;