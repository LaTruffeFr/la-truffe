import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  TrendingDown, 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  LogIn,
  Zap,
  Clock,
  BadgeCheck
} from 'lucide-react';
import { 
  SearchHero, 
  SocialProof, 
  PriceAuditSimulator, 
  ExampleReportCard 
} from '@/components/landing';
import logoTruffe from '@/assets/logo-truffe.jpg';

const Landing = () => {
  const navigate = useNavigate();

  const exampleReports = [
    { brand: 'Volkswagen', model: 'Golf 7 TDI', year: 2019, mileage: 78000, savings: 2400, score: 9.2 },
    { brand: 'Peugeot', model: '308 GT Line', year: 2020, mileage: 45000, savings: 1850, score: 8.8 },
    { brand: 'BMW', model: 'Série 3 320d', year: 2018, mileage: 92000, savings: 3200, score: 9.5 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-10 w-10 rounded-lg object-cover shadow-corporate"
              />
              <span className="text-xl font-bold text-foreground">La Truffe</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/auth')} 
                variant="ghost"
                className="hidden sm:flex"
              >
                Se connecter
              </Button>
              <Button onClick={() => navigate('/auth')} className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Créer un compte</span>
                <span className="sm:hidden">Inscription</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <SearchHero />

      {/* Social Proof Bar */}
      <SocialProof />

      {/* Price Audit Simulator with Gauge */}
      <PriceAuditSimulator />

      {/* Example Reports Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Exemples de Rapports
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez le type d'opportunités que notre algorithme détecte chaque jour
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {exampleReports.map((report, index) => (
              <ExampleReportCard key={index} {...report} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground">
              Un processus simple en 3 étapes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="corporate-card border-0">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2">ÉTAPE 1</div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Entrez votre recherche</h3>
                <p className="text-sm text-muted-foreground">
                  Indiquez le modèle qui vous intéresse : Golf 7, 308, Clio...
                </p>
              </CardContent>
            </Card>

            <Card className="corporate-card border-0">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2">ÉTAPE 2</div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Analyse IA du marché</h3>
                <p className="text-sm text-muted-foreground">
                  Notre algorithme scanne et compare des milliers d'annonces en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card className="corporate-card border-0">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2">ÉTAPE 3</div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Recevez votre rapport</h3>
                <p className="text-sm text-muted-foreground">
                  Un rapport complet avec les meilleures affaires et les économies potentielles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Pourquoi nous faire confiance ?
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: TrendingDown, text: "Analyse de milliers d'annonces en temps réel" },
                { icon: BadgeCheck, text: "Identification des véhicules sous-cotés" },
                { icon: Clock, text: "Rapport personnalisé en 24-48h" },
                { icon: Shield, text: "Économies moyennes de 15 à 30%" },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 corporate-card"
                >
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-foreground font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Prêt à économiser sur votre prochaine voiture ?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Créez votre compte gratuitement et commandez votre premier rapport d'audit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 font-bold"
            >
              Créer mon compte <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="font-semibold text-foreground">La Truffe</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Données sécurisées</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} La Truffe. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
