import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { Footer } from "@/components/landing";
import {
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Shield,
  Clock,
  Award,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function SellLanding() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: BarChart3,
      title: "Analyse de marché avancée",
      description:
        "Notre algorithme analyse les prix du marché en temps réel pour vous proposer le meilleur tarif",
    },
    {
      icon: Users,
      title: "Acheteurs qualifiés",
      description:
        "Accédez à une communauté d'acheteurs sérieux et intéressés par les rapports détaillés",
    },
    {
      icon: TrendingUp,
      title: "Visibilité maximale",
      description:
        "Vos annonces sont boostées par notre algorithme pour plus de vues et de contacts",
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description:
        "Nous vérifions les acheteurs et facilitons les transactions en toute confiance",
    },
    {
      icon: Clock,
      title: "Vente rapide",
      description:
        "Grâce aux rapports détaillés, les acheteurs décident plus vite. Vendez en jours, pas en mois",
    },
    {
      icon: Award,
      title: "Certification professionnelle",
      description:
        "Tous les véhicules sont analysés par notre système d'évaluation expert",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Déposez votre annonce",
      description: "Remplissez les informations basiques de votre véhicule en 5 minutes",
    },
    {
      number: "2",
      title: "Nous analysons",
      description:
        "Notre moteur d'expertise génère un rapport détaillé avec prix équitable et points forts",
    },
    {
      number: "3",
      title: "Acheteurs viennent",
      description:
        "Des acheteurs qualifiés contactent directement avec confiance",
    },
    {
      number: "4",
      title: "Concluez la vente",
      description: "Négociez directement avec les acheteurs intéressés",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO SECTION */}
      <section className="relative py-24 bg-gradient-to-b from-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-6 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Pour les vendeurs
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Vendez votre voiture au meilleur prix
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
               Nos rapports d'expertise révèlent la vraie valeur de votre véhicule. Les acheteurs viennent
              avec confiance. Vous concluez rapidement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/vendre/formulaire")}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold"
              >
                Commencer à vendre
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20"
              >
                Voir un exemple de rapport
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1,200+</div>
              <p className="text-gray-600">Véhicules vendus cette année</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-gray-600">Plus d'acheteurs en moyenne</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">14 jours</div>
              <p className="text-gray-600">Temps moyen de vente</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <p className="text-gray-600">Satisfaction vendeurs</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Pourquoi vendre avec La Truffe?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des outils et des acheteurs qualifiés pour vendre vite et bien
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={idx}
                  className="hover:shadow-lg transition-all duration-300 border-0 bg-slate-50"
                >
                  <CardHeader>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comment ça marche?
            </h2>
            <p className="text-xl text-gray-600">
              De votre annonce à la vente en 4 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Connecteur */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-1 bg-blue-200"></div>
                )}

                <div className="bg-white rounded-2xl p-6 relative z-10">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 text-center">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 text-center">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES LIST */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Ce que vous obtenez gratuitement
            </h2>
          </div>

          <div className="space-y-4">
            {[
              "Rapport d'expertise détaillé valorisant votre véhicule",
              "Photo HD et galerie multi-photos",
              "Statistiques en temps réel (vues, contacts)",
              "Gestion des notifications de contact",
              "Historique complet des modifications",
              "Promotion optionnelle (featured listings)",
              "Support client par email",
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-blue-50 transition"
              >
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-lg text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à vendre votre véhicule?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Rejoignez les centaines de vendeurs qui ont vendu rapidement et au juste prix sur
            La Truffe
          </p>
          <Button
            onClick={() => navigate("/vendre/formulaire")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Créer une annonce maintenant
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
