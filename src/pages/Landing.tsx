import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { 
  SearchHero, 
  SocialProof, 
  ExampleReportCard,
  WhyUsSection,
  ReportPreviewSection,
  StatisticsSection,
  FAQSection,
  Footer
} from '@/components/landing';
import logoLatruffe from '@/assets/logo-latruffe.png';

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
                src={logoLatruffe}
                alt="Logo La Truffe" 
                className="h-10 w-auto"
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

      {/* Why Us Section - 3 Cards */}
      <WhyUsSection />

      {/* Report Preview Section */}
      <ReportPreviewSection />

      {/* Statistics Section - Blue Banner */}
      <StatisticsSection />

      {/* Example Reports Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
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

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
