import { Check } from 'lucide-react';
import { PriceGauge } from './PriceGauge';

const features = [
  "La Jauge de Prix : Êtes-vous dans le Vert (Affaire) ou le Rouge (Arnaque) ?",
  "Le Score de Confiance : Une note sur 10 pour décider vite.",
  "L'Estimation de Négociation : Le montant exact à demander au vendeur.",
  "Comparatif Marché : Les 5 annonces concurrentes moins chères."
];

export function ReportPreviewSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text content */}
            <div className="animate-fade-in-up">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Ce que contient votre Audit de Prix.
              </h2>
              
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li 
                    key={index} 
                    className={`flex items-start gap-3 animate-fade-in-up animate-delay-${(index + 1) * 100}`}
                  >
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right - Gauge Preview */}
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border hover-lift animate-fade-in-up animate-delay-200">
              <div className="text-center mb-4">
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  APERÇU DU RAPPORT
                </span>
              </div>
              <PriceGauge 
                marketPrice={28500} 
                ourPrice={24100} 
                savings={4400} 
              />
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Prix Marché</p>
                  <p className="text-xl font-bold text-foreground">28 500 €</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Meilleure Offre</p>
                  <p className="text-xl font-bold text-success">24 100 €</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
