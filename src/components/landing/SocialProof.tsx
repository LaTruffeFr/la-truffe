import { Users } from 'lucide-react';

export function SocialProof() {
  const mediaLogos = [
    { name: 'Auto Plus', abbrev: 'AP' },
    { name: 'Turbo', abbrev: 'TB' },
    { name: 'Caradisiac', abbrev: 'CD' },
    { name: 'L\'Argus', abbrev: 'AR' },
    { name: 'Auto Moto', abbrev: 'AM' },
  ];

  return (
    <section className="py-6 bg-muted/50 border-y border-border">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Déjà <span className="text-primary font-bold">1 500+</span> rapports générés ce mois-ci
          </p>
        </div>
        
        {/* Media logos */}
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Vu sur</span>
          {mediaLogos.map((logo) => (
            <div 
              key={logo.name}
              className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">{logo.abbrev}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
