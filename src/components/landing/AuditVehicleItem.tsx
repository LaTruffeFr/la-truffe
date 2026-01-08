import { Lock } from 'lucide-react';

interface AuditVehicleItemProps {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  score: number;
  imageUrl?: string;
  isBlurred?: boolean;
}

export function AuditVehicleItem({
  brand,
  model,
  year,
  mileage,
  score,
  imageUrl = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=150&fit=crop',
  isBlurred = false,
}: AuditVehicleItemProps) {
  const isGoodScore = score >= 8;
  const isMediumScore = score >= 6 && score < 8;

  return (
    <div className="audit-list-item">
      {/* Image */}
      <div className="relative w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={imageUrl}
          alt={`${brand} ${model}`}
          className={`w-full h-full object-cover ${isBlurred ? 'blur-sm' : ''}`}
        />
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-foreground truncate ${isBlurred ? 'blur-sm' : ''}`}>
          {brand} {model}
        </h4>
        <p className={`text-sm text-muted-foreground ${isBlurred ? 'blur-sm' : ''}`}>
          {year} • {mileage.toLocaleString('fr-FR')} km
        </p>
      </div>
      
      {/* Score */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Score La Truffe
        </span>
        <div 
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold ${
            isGoodScore 
              ? 'border-success text-success' 
              : isMediumScore 
                ? 'border-warning text-warning' 
                : 'border-destructive text-destructive'
          }`}
        >
          <div className="text-center">
            <span className="text-base">{score.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
