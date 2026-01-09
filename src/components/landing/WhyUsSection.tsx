import { Search, TrendingDown, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: "Prix Cachés",
    description: "Les cotes classiques (La Centrale, Argus) sont des moyennes. Elles ne détectent pas les vraies affaires."
  },
  {
    icon: TrendingDown,
    title: "Dépréciation Immédiate",
    description: "Acheter au mauvais prix, c'est perdre 1500€ dès la remise des clés."
  },
  {
    icon: ShieldCheck,
    title: "L'Avantage La Truffe",
    description: "Notre IA scanne le marché réel pour vous dire exactement combien négocier."
  }
];

export function WhyUsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Pourquoi 90% des acheteurs perdent de l'argent ?
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
