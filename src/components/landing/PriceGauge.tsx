import { useEffect, useState } from 'react';

interface PriceGaugeProps {
  marketPrice: number;
  ourPrice: number;
  savings: number;
}

export function PriceGauge({ marketPrice, ourPrice, savings }: PriceGaugeProps) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate the percentage (0-100) where the needle should point
  // Green zone (left) = 0-40%, Yellow zone = 40-70%, Red zone (right) = 70-100%
  const priceRatio = ourPrice / marketPrice;
  // Map price ratio to gauge position (lower price = more to the left/green)
  const needlePosition = Math.max(10, Math.min(90, priceRatio * 100));
  
  // Convert position to angle (-90 to 90 degrees for a half circle)
  const needleAngle = (needlePosition / 100) * 180 - 90;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Gauge SVG */}
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background arc segments */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
            <stop offset="40%" stopColor="hsl(160, 84%, 39%)" />
            <stop offset="50%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="70%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" />
          </linearGradient>
        </defs>
        
        {/* Main gauge arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Gauge ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = (tick / 100) * 180 - 90;
          const rad = (angle * Math.PI) / 180;
          const innerR = 60;
          const outerR = 70;
          const cx = 100;
          const cy = 100;
          return (
            <line
              key={tick}
              x1={cx + innerR * Math.cos(rad)}
              y1={cy + innerR * Math.sin(rad)}
              x2={cx + outerR * Math.cos(rad)}
              y2={cy + outerR * Math.sin(rad)}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Needle */}
        <g 
          transform={`rotate(${animated ? needleAngle : -90} 100 100)`}
          style={{ transition: 'transform 1.5s ease-out' }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r="8"
            fill="hsl(var(--foreground))"
          />
        </g>
        
        {/* Labels */}
        <text x="25" y="115" fontSize="10" fill="hsl(var(--success))" fontWeight="600">
          AFFAIRE
        </text>
        <text x="155" y="115" fontSize="10" fill="hsl(var(--destructive))" fontWeight="600">
          CHER
        </text>
      </svg>
      
      {/* Center savings display */}
      <div className="absolute inset-0 flex items-center justify-center pt-8">
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-extrabold text-success">
            - {savings.toLocaleString('fr-FR')} €
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Économie potentielle
          </p>
        </div>
      </div>
    </div>
  );
}
