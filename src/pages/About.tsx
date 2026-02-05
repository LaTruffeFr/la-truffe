import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Lightbulb, Globe } from "lucide-react";
import { Footer } from "@/components/landing";
import { Header } from '@/components/Header';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      <Header activeLink="about" />

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 mb-6">
            Notre Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Nous vous aidons à choisir, entretenir et vendre votre véhicule.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Notre équipe innove constamment pour concevoir des outils d'analyse de marché et apporter la puissance de la
            "Data Automobile" à votre porte.
          </p>
        </div>
      </section>

      {/* --- NOTRE APPROCHE (3 Colonnes) --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Expert de la Data</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nos rapports sont élaborés à partir d'informations issues de centaines de sources : annonces en ligne,
                historiques de prix et bases de données constructeurs. Nous classons ces millions de données pour les
                rendre compréhensibles en un coup d'œil.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Redonner le pouvoir</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Travailler avec la data nous a appris beaucoup sur le marché de l'occasion. Notre objectif est de
                partager ce savoir pour mettre les acheteurs aux commandes, grâce à des rapports clairs et des conseils
                d'experts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Une ambition Européenne</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Le marché automobile ne s'arrête pas aux frontières. Nous analysons les prix en France, Allemagne,
                Belgique et dans les pays voisins pour élever le niveau de transparence du marché européen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NOTRE HISTOIRE / VISION --- */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pour un marché plus transparent</h2>
          </div>

          <div className="space-y-8 text-lg text-slate-600 leading-relaxed text-justify">
            <p>
              Pendant des décennies, l'achat d'une voiture d'occasion a été comme un jeu de cache-cache entre acheteurs
              et vendeurs. Il y a encore quelques années, on ne pouvait que prier pour que le vendeur soit sincère ou
              espérer avoir fait une bonne affaire.
            </p>
            <p>
              <strong>Ce n'est plus le cas aujourd'hui !</strong>
            </p>
            <p>
              Grâce aux données automobiles, nous pouvons connaître la valeur réelle de n'importe quel véhicule sur le
              marché. En tant que plateforme d'analyse, la transparence est l'objectif principal de La Truffe.
            </p>
            <p>
              Nous sommes fiers de dire que l'existence de nos rapports rend la vente de véhicules surévalués plus
              difficile. Les acheteurs comprennent que dépenser un peu pour vérifier le prix revient bien moins cher que
              de perdre des milliers d'euros à la revente.
            </p>
            <p className="font-medium text-slate-900 italic">
              Le résultat est bénéfique pour tout le monde : la qualité des transactions augmente et les acheteurs se
              sentent en sécurité.
            </p>
          </div>
        </div>
      </section>

      {/* --- CHIFFRES CLÉS (Réalistes pour La Truffe) --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-12">La Truffe en quelques chiffres</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-extrabold text-primary mb-2">10M+</div>
              <div className="text-sm font-medium text-slate-500">Annonces analysées</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary mb-2">100%</div>
              <div className="text-sm font-medium text-slate-500">Indépendant</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary mb-2">24/7</div>
              <div className="text-sm font-medium text-slate-500">Analyse en temps réel</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary mb-2">Europe</div>
              <div className="text-sm font-medium text-slate-500">Couverture marché</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Rejoignez le mouvement de la transparence</h2>
          <p className="text-lg text-slate-300 mb-10">Faites partie des acheteurs qui ne laissent rien au hasard.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white h-14 px-8 text-lg"
              onClick={() => navigate("/auth")}
            >
              Créer un compte gratuit
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-slate-900 border-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg"
              onClick={() => navigate("/")}
            >
              Lancer un audit
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
