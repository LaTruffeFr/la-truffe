import { useState, useEffect } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PriceGauge } from './PriceGauge';
import { AuditVehicleItem } from './AuditVehicleItem';
import { Disclaimer } from './Disclaimer';

// Demo data
const DEMO_DATA = {
  searchQuery: 'Volkswagen Golf 7',
  avgMarketPrice: 18500,
  ourPrice: 14200,
  vehicleCount: 127,
  vehicles: [
    { brand: 'Volkswagen', model: 'Golf 7 TDI', year: 2019, mileage: 78000, score: 9.2, isBlurred: false },
    { brand: 'Volkswagen', model: 'Golf 7 TSI', year: 2020, mileage: 45000, score: 8.8, isBlurred: true },
    { brand: 'Volkswagen', model: 'Golf 7 GTI', year: 2018, mileage: 92000, score: 8.5, isBlurred: true },
    { brand: 'Volkswagen', model: 'Golf 7 R-Line', year: 2019, mileage: 67000, score: 7.9, isBlurred: true },
  ],
};

export function PriceAuditSimulator() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  const savings = DEMO_DATA.avgMarketPrice - DEMO_DATA.ourPrice;
  const savingsPercent = Math.round((savings / DEMO_DATA.avgMarketPrice) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="trust-badge-primary mb-4 inline-block">
            EXEMPLE : {DEMO_DATA.searchQuery.toUpperCase()}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Résultat de l'audit de prix
          </h2>
          <p className="text-muted-foreground mt-2">
            Analyse basée sur {DEMO_DATA.vehicleCount} annonces du marché
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Gauge */}
          <div 
            className={`corporate-card-elevated p-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h3 className="text-lg font-semibold text-center mb-6 text-foreground">
              Jauge de Prix
            </h3>
            
            <PriceGauge 
              marketPrice={DEMO_DATA.avgMarketPrice}
              ourPrice={DEMO_DATA.ourPrice}
              savings={savings}
            />
            
            {/* Stats below gauge */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Prix moyen marché</p>
                <p className="text-xl font-bold text-destructive line-through">
                  {DEMO_DATA.avgMarketPrice.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Prix "La Truffe"</p>
                <p className="text-xl font-bold text-success">
                  {DEMO_DATA.ourPrice.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            
            <div className="text-center mt-4 p-3 bg-success/10 rounded-lg">
              <p className="text-sm text-success font-medium">
                Économisez <span className="font-bold">{savingsPercent}%</span> sur votre achat
              </p>
            </div>
          </div>

          {/* Right: Vehicle list */}
          <div 
            className={`corporate-card-elevated p-8 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h3 className="text-lg font-semibold mb-6 text-foreground">
              Véhicules certifiés "La Truffe"
            </h3>
            
            <div className="space-y-3">
              {DEMO_DATA.vehicles.map((vehicle, index) => (
                <AuditVehicleItem
                  key={index}
                  {...vehicle}
                />
              ))}
            </div>
            
            {/* CTA overlay for locked items */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
              <Lock className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Créez un compte pour voir les 4 autres opportunités
              </p>
              <Button onClick={() => navigate('/auth')} className="gap-2">
                Débloquer les résultats
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-6">
              <Disclaimer />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
