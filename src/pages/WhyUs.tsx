import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, Clock, UserCheck, AlertTriangle, 
  CheckCircle2, TrendingDown, Wrench, Globe, ArrowRight, Star, Car
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { Header } from '@/components/Header';

const WhyUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      
      <Header activeLink="why-us" />

      {/* --- HERO SECTION --- */}
      <section className="relative py-24 overflow-hidden bg-slate-900 text-white">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 mb-6">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            La référence de l'audit automobile
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Des transactions automobiles dont tu peux être <span className="text-primary">fier</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Une super affaire est quelque chose dont tu te souviendras longtemps. 
            Que tu sois acheteur pour la première fois ou expert, La Truffe t'apporte la clarté et la confiance pour décider vite et bien.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white h-14 px-8 text-lg shadow-xl shadow-primary/20" onClick={() => navigate('/')}>
            Lancer une analyse gratuite <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* --- 3 PILLARS GRID --- */}
      <section className="py-20 bg-white -mt-10 rounded-t-[3rem] relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Pourquoi La Truffe ?</h2>
            <p className="text-slate-500 mt-2">Trois raisons de ne plus jamais surpayer votre véhicule.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group">
              <div className="w-14 h-14 bg-white text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Économise un temps précieux</h3>
              <p className="text-slate-600 mb-4">
                Ne perdez plus des heures à éplucher des annonces qui ne valent pas le coup. La Truffe scanne le marché pour vous.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Analyse instantanée :</strong> Des milliers d'annonces comparées en 1 clic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Filtrage intelligent :</strong> On écarte les mauvaises affaires pour vous.</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors group">
              <div className="w-14 h-14 bg-white text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Vérifie les dires du vendeur</h3>
              <p className="text-slate-600 mb-4">
                Les vendeurs défendent leur prix. La Truffe vous donne les données objectives pour savoir si ce prix est justifié.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Cote réelle :</strong> Basée sur le marché actuel, pas sur des estimations théoriques.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Décote kilométrique :</strong> Calculez l'usure exacte du véhicule.</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-red-200 transition-colors group">
              <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Évite les pertes financières</h3>
              <p className="text-slate-600 mb-4">
                L'achat d'une voiture est un investissement. Ne vous retrouvez pas avec un véhicule impossible à revendre sans perte.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Liquidité :</strong> Sachez si ce modèle se revend vite.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Projection :</strong> Estimez la perte de valeur future.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- DEEP DIVE SECTIONS (Z-Pattern) --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Block 1: Confiance */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
            <div className="flex-1 order-2 lg:order-1">
              <div className="inline-block p-3 bg-blue-100 text-blue-700 rounded-xl mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Booste ta confiance</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                En matière de voitures d'occasion, le savoir est le pouvoir.
                Nos rapports La Truffe te permettent de maîtriser le marché, de comprendre la dynamique des prix et d'obtenir la voiture que tu veux - à tes conditions.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-bold text-slate-900 mb-2">Positionnement Prix</h4>
                  <p className="text-sm text-slate-500">Visualise où se situe l'offre par rapport à la moyenne nationale.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-bold text-slate-900 mb-2">Opportunités cachées</h4>
                  <p className="text-sm text-slate-500">Détecte les baisses de prix avant les autres acheteurs.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50 aspect-square lg:aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <ShieldCheck className="w-12 h-12 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-400">Expertise & Maîtrise</p>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Négociation */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
            <div className="flex-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50 aspect-square lg:aspect-[4/3] bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <TrendingDown className="w-12 h-12 text-green-600" />
                  </div>
                  <p className="font-bold text-slate-400">Économies Réalisées</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 bg-green-100 text-green-700 rounded-xl mb-6">
                <TrendingDown className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Négocie un meilleur prix</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Obtiens les infos. Paie le juste prix. Nos rapports La Truffe te donnent les arguments factuels que les vendeurs ne peuvent ignorer.
                Utilise nos données de marché pour négocier en position de force.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Argumente avec des preuves</h4>
                    <p className="text-sm text-slate-500">Un rapport La Truffe imprimé est ton meilleur allié face au vendeur.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Détecte les marges de négo</h4>
                    <p className="text-sm text-slate-500">Sachez exactement combien le véhicule est surévalué.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Sérénité */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 order-2 lg:order-1">
              <div className="inline-block p-3 bg-orange-100 text-orange-700 rounded-xl mb-6">
                <Car className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Achète en toute sérénité</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Ta voiture mérite toute ton attention. Avec La Truffe, tu ne laisses rien au hasard.
                Du prix d'achat à la facilité de revente, nous analysons chaque aspect financier de ton futur véhicule.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-slate-700">Validation du modèle et de la finition</span>
                </li>
                <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-slate-700">Comparaison avec les offres similaires</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50 aspect-square lg:aspect-[4/3] bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Car className="w-12 h-12 text-orange-600" />
                  </div>
                  <p className="font-bold text-slate-400">Sérénité & Transparence</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- TESTIMONIAL 2 --- */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="flex justify-center mb-4">
            {[1,2,3,4,5].map(star => (
              <svg key={star} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            ))}
          </div>
          <blockquote className="text-2xl font-medium text-slate-900 mb-6">
            "J'adore La Truffe ! Ça m'a tranquillisé et m'a prouvé que la voiture que j'achetais était au bon prix."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-500">
               AW
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-sm">Ashley Webster</p>
              <p className="text-slate-500 text-xs">Avis Vérifié • Utilisateur La Truffe</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- GLOBAL TRUST SECTION --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block p-3 bg-indigo-50 text-indigo-600 rounded-full mb-6">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Une analyse sans frontières</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-12">
            La Truffe analyse les marchés de toute l'Europe pour vous trouver les meilleures opportunités, où qu'elles soient.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-500">
            {['France', 'Belgique', 'Suisse', 'Allemagne', 'Italie', 'Espagne', 'Luxembourg', 'Pays-Bas'].map(country => (
              <span key={country} className="px-4 py-2 bg-slate-100 rounded-full">
                {country}
              </span>
            ))}
            <span className="px-4 py-2 bg-slate-100 rounded-full text-primary">+ 20 autres pays</span>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Le juste prix de ta voiture t'attend, es-tu prêt ?</h2>
          <p className="text-xl text-slate-300 mb-10">
            Des milliers d'euros d'économie potentielle. Connaître les faits peut faire toute la différence.
            Réalise des transactions dont tu seras fier avec La Truffe.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white h-14 px-8 text-lg w-full sm:w-auto shadow-2xl" onClick={() => navigate('/audit/demo-1')}>
              Voir un exemple de rapport
            </Button>
            <Button size="lg" variant="outline" className="text-slate-900 border-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg w-full sm:w-auto" onClick={() => navigate('/')}>
              Commencer maintenant
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WhyUs;