import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTypewriter } from '@/hooks/useTypewriter';

export function SearchHero() {
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [precision, setPrecision] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  // Pause animation when any field is focused
  const isPaused = focusedField !== null;
  const typewriterText = useTypewriter(isPaused);

  const handleSearch = () => {
    navigate('/auth');
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight text-balance animate-fade-in-up">
          Achetez votre voiture d'occasion<br />
          <span className="text-primary">au vrai prix du marché</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
          Collez le lien d'une annonce (LeBonCoin, LaCentrale). Notre algorithme analyse 100% du marché pour vous dire si c'est une bonne affaire ou une arnaque.
        </p>
        
        {/* Search bar with 3 fields */}
        <div className="max-w-4xl mx-auto animate-fade-in-up animate-delay-200">
          <div className="search-bar flex-col sm:flex-row gap-0">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch">
              {/* Marque field */}
              <div className="flex-1 flex items-center px-4 py-3 sm:py-4 border-b sm:border-b-0 sm:border-r border-border/50 relative">
                <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0 sm:hidden" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={marque}
                    onChange={(e) => setMarque(e.target.value)}
                    onFocus={() => setFocusedField('marque')}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-transparent border-none outline-none text-foreground text-base relative z-10"
                  />
                  {!marque && focusedField !== 'marque' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground text-base pointer-events-none">
                      {typewriterText.marque || 'Marque'}
                      <span className="animate-pulse ml-0.5 opacity-60">|</span>
                    </span>
                  )}
                  {!marque && focusedField === 'marque' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground/50 text-base pointer-events-none">
                      Marque
                    </span>
                  )}
                </div>
              </div>

              {/* Modèle field */}
              <div className="flex-1 flex items-center px-4 py-3 sm:py-4 border-b sm:border-b-0 sm:border-r border-border/50 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={modele}
                    onChange={(e) => setModele(e.target.value)}
                    onFocus={() => setFocusedField('modele')}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-transparent border-none outline-none text-foreground text-base relative z-10"
                  />
                  {!modele && focusedField !== 'modele' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground text-base pointer-events-none">
                      {typewriterText.modele || 'Modèle'}
                      <span className="animate-pulse ml-0.5 opacity-60">|</span>
                    </span>
                  )}
                  {!modele && focusedField === 'modele' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground/50 text-base pointer-events-none">
                      Modèle
                    </span>
                  )}
                </div>
              </div>

              {/* Précision field */}
              <div className="flex-1 flex items-center px-4 py-3 sm:py-4 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={precision}
                    onChange={(e) => setPrecision(e.target.value)}
                    onFocus={() => setFocusedField('precision')}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-transparent border-none outline-none text-foreground text-base relative z-10"
                  />
                  {!precision && focusedField !== 'precision' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground text-base pointer-events-none">
                      {typewriterText.precision || 'Précision'}
                      <span className="animate-pulse ml-0.5 opacity-60">|</span>
                    </span>
                  )}
                  {!precision && focusedField === 'precision' && (
                    <span className="absolute inset-0 flex items-center text-muted-foreground/50 text-base pointer-events-none">
                      Précision (optionnel)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSearch}
              size="lg"
              className="m-2 px-6 md:px-8 font-bold text-sm md:text-base whitespace-nowrap"
            >
              LANCER L'AUDIT
            </Button>
          </div>
          
          {/* Quick suggestions */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap animate-fade-in-up animate-delay-300">
            <span className="text-sm text-muted-foreground">Populaire :</span>
            {[
              { marque: 'Golf 7', modele: 'GTI' },
              { marque: 'Peugeot', modele: '308' },
              { marque: 'BMW', modele: 'Série 3' },
              { marque: 'Clio', modele: '5' },
            ].map((item) => (
              <button
                key={`${item.marque}-${item.modele}`}
                onClick={() => {
                  setMarque(item.marque);
                  setModele(item.modele);
                }}
                className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
              >
                {item.marque} {item.modele}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
