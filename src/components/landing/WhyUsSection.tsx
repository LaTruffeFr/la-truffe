import { Search, Shield, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: "La Réalité du Marché",
    description: "90% des annonces sont surcotées. Nous scannons 50 000+ données pour révéler le vrai prix."
  },
  {
    icon: Shield,
    title: "Négociez avec des Preuves",
    description: "Ne demandez pas une remise. Prouvez que le prix est trop haut grâce à notre rapport certifié."
  },
  {
    icon: PiggyBank,
    title: "Rentabilisé au premier achat",
    description: "Un rapport à 19€ pour économiser en moyenne 1 200€. Le calcul est vite fait."
  }
];

export function WhyUsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Ce que les vendeurs ne vous disent pas.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="corporate-card border-0 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
