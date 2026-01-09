import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function SearchHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate('/auth');
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight text-balance animate-fade-in-up">
          Ne surpayez plus votre<br />
          <span className="text-primary">prochaine voiture.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
          Le 1<sup>er</sup> rapport d'audit de prix basé sur l'IA.<br className="hidden md:block" />
          Vérifiez la valeur réelle du marché en 2 secondes.
        </p>
        
        {/* Search bar */}
        <div className="max-w-2xl mx-auto animate-fade-in-up animate-delay-200">
          <div className="search-bar">
            <div className="flex-1 flex items-center px-5 py-4">
              <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Entrez le modèle (ex: Audi RS3)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch}
              size="lg"
              className="m-2 px-6 md:px-8 font-bold text-sm md:text-base whitespace-nowrap animate-pulse-subtle"
            >
              LANCER L'AUDIT DE PRIX
            </Button>
          </div>
          
          {/* Quick suggestions */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap animate-fade-in-up animate-delay-300">
            <span className="text-sm text-muted-foreground">Populaire :</span>
            {['Golf 7', 'Peugeot 308', 'BMW Série 3', 'Clio 5'].map((model) => (
              <button
                key={model}
                onClick={() => {
                  setSearchQuery(model);
                }}
                className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
