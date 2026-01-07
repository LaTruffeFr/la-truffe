import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, TrendingDown, Shield, ArrowRight, CheckCircle, LogIn } from 'lucide-react';
import { DemoSavingsSimulator } from '@/components/DemoSavingsSimulator';

const Landing = () => {
  const navigate = useNavigate();
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/76765751-c461-4096-a57b-30bb3f498569.png" 
              alt="Logo Truffe" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold text-foreground">Auto Sniper</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline" className="gap-2">
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Trouvez votre voiture d'occasion<br />
          <span className="text-primary">au meilleur prix du marché</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Notre algorithme analyse des milliers d'annonces pour vous dénicher les meilleures affaires. 
          Économisez jusqu'à 30% sur votre prochain achat.
        </p>
      </section>

      {/* Demo Simulator Section */}
      <section className="container mx-auto px-4 pb-16">
        <DemoSavingsSimulator />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Commandez votre rapport</h3>
              <p className="text-muted-foreground">
                Dites-nous quel modèle vous cherchez : Golf 7, 308, Clio... On s'occupe du reste.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Analyse du marché</h3>
              <p className="text-muted-foreground">
                Notre algorithme scanne les annonces et compare les prix pour identifier les meilleures opportunités.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Recevez votre rapport</h3>
              <p className="text-muted-foreground">
                Un rapport PDF avec les meilleures affaires, liens directs et économies potentielles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/50 rounded-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Pourquoi nous faire confiance ?</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            "Analyse de milliers d'annonces en temps réel",
            "Identification des prix sous-cotés",
            "Rapport personnalisé en 24-48h",
            "Économies moyennes de 15-30%",
            "Liens directs vers les annonces",
            "Accompagnement personnalisé"
          ].map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-primary text-primary-foreground p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">Prêt à économiser sur votre prochaine voiture ?</h2>
          <p className="text-lg mb-8 opacity-90">
            Créez votre compte et commandez votre premier rapport pour seulement 19€.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
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
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Données sécurisées</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Auto Sniper. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
