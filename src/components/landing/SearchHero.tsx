import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EXAMPLE_SEARCHES = [
  'Audi RS3',
  'BMW M3',
  'Peugeot 308 GT',
  'Golf 7 GTI',
  'Mercedes Classe A',
  'Renault Mégane RS',
  'Porsche 911',
];

export function SearchHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentText = EXAMPLE_SEARCHES[currentIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = isDeleting ? 500 : 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (placeholder.length < currentText.length) {
          setPlaceholder(currentText.slice(0, placeholder.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (placeholder.length > 0) {
          setPlaceholder(placeholder.slice(0, -1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % EXAMPLE_SEARCHES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, currentIndex]);

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
        
        {/* Search bar */}
        <div className="max-w-2xl mx-auto animate-fade-in-up animate-delay-200">
          <div className="search-bar">
            <div className="flex-1 flex items-center px-5 py-4 relative">
              <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent border-none outline-none text-foreground text-lg relative z-10"
                />
                {/* Animated placeholder overlay */}
                {!searchQuery && (
                  <span className="absolute inset-0 flex items-center text-muted-foreground text-lg pointer-events-none">
                    {placeholder}
                    <span className="animate-pulse ml-0.5">|</span>
                  </span>
                )}
              </div>
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
