import { CheckCircle, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExampleReportCardProps {
  id?: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  savings: number;
  score: number;
  imageUrl?: string;
  onClick?: () => void;
}

export function ExampleReportCard({
  brand,
  model,
  year,
  mileage,
  savings,
  score,
  imageUrl = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
  onClick,
}: ExampleReportCardProps) {
  const isGoodScore = score >= 8;

  return (
    <div 
      className="corporate-card overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Image with badges */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="trust-badge-primary">
            <CheckCircle className="h-3.5 w-3.5" />
            PRIX VÉRIFIÉ
          </span>
          <span className="trust-badge-success">
            <TrendingDown className="h-3.5 w-3.5" />
            ÉCONOMIE : {savings.toLocaleString('fr-FR')} €
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {brand} {model}
            </h3>
            <p className="text-sm text-muted-foreground">
              {year} • {mileage.toLocaleString('fr-FR')} km
            </p>
          </div>
          
          {/* Score circle */}
          <div 
            className={`w-14 h-14 ${isGoodScore ? 'score-circle-good' : 'score-circle-medium'}`}
          >
            <div className="text-center">
              <span className="text-lg font-bold">{score.toFixed(1)}</span>
              <span className="text-xs block -mt-1">/10</span>
            </div>
          </div>
        </div>
        
        <Button variant="outline" className="w-full gap-2" size="sm">
          Voir l'exemple de rapport
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
