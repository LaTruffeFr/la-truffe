import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, ChevronDown, User, Sparkles, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileNav } from '@/components/landing';
import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { BetaWaitlistModal } from '@/components/BetaWaitlistModal';

interface HeaderProps {
  variant?: 'default' | 'minimal';
  activeLink?: 'home' | 'pricing' | 'why-us' | 'contact' | 'about' | 'none';
}

export const Header = ({ variant = 'default', activeLink = 'none' }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVip } = useVipAccess();
  const [showBetaModal, setShowBetaModal] = useState(false);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
            La Truffe
          </Link>
          
          {variant === 'default' && (
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
              <Link 
                to="/" 
                className={activeLink === 'home' ? 'text-primary font-semibold' : 'hover:text-primary transition-colors'}
              >
                Accueil
              </Link>
              
              {/* 👇👇👇 NOUVEAU BOUTON AJOUTÉ ICI 👇👇👇 */}
              <Link 
                to="/vendre" 
                className="flex items-center gap-1 text-green-600 font-bold hover:text-green-700 transition-colors animate-in fade-in slide-in-from-top-1"
              >
                <Sparkles className="w-4 h-4" /> Vendre ma voiture
              </Link>
              {/* 👆👆👆 FIN DU NOUVEAU BOUTON 👆👆👆 */}

              <Link 
                to="/annonces" 
                className="font-medium hover:text-primary transition-colors"
              >
              Acheter
              </Link>
              
              <div className="relative group">
                <button className={`flex items-center gap-1 transition-colors focus:outline-none py-2 ${activeLink === 'pricing' ? 'text-primary font-semibold' : 'hover:text-primary'}`}>
                  Rapports <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-60 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block p-1 animate-in fade-in zoom-in-95 duration-200">
                  <Link to="/demo/demo-1" className="block px-4 py-2.5 hover:bg-slate-50 hover:text-primary rounded-lg">Exemple de rapport</Link>
                  <Link to="/pricing" className={`block px-4 py-2.5 rounded-lg ${activeLink === 'pricing' ? 'font-medium bg-primary/5 text-primary' : 'hover:bg-slate-50 hover:text-primary'}`}>Prix & Abonnements</Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <Link to="/why-us" className={`block px-4 py-2.5 rounded-lg ${activeLink === 'why-us' ? 'font-medium bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`}>Pourquoi nous choisir ?</Link>
                </div>
              </div>

              <div className="relative group">
                <button className={`flex items-center gap-1 transition-colors focus:outline-none py-2 ${activeLink === 'about' || activeLink === 'contact' ? 'text-primary font-semibold' : 'hover:text-primary'}`}>
                  Entreprise <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block p-1 animate-in fade-in zoom-in-95 duration-200">
                  <Link to="/qui-sommes-nous" className={`block px-4 py-2.5 rounded-lg transition-colors ${activeLink === 'about' ? 'font-medium bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`}>
                    Qui sommes-nous ?
                  </Link>
                  <Link to="/contact" className={`block px-4 py-2.5 rounded-lg transition-colors ${activeLink === 'contact' ? 'font-medium bg-primary/5 text-primary' : 'hover:bg-slate-50 hover:text-primary'}`}>
                    Contact
                  </Link>
                </div>
              </div>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {isVip && (
                  <Badge variant="outline" className="hidden sm:flex items-center gap-1 border-amber-400 bg-amber-50 text-amber-700 font-semibold text-xs px-2 py-0.5">
                    <Crown className="h-3 w-3" />
                    VIP
                  </Badge>
                )}
                <Button 
                  onClick={() => navigate('/client-dashboard')} 
                  className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Mon Espace</span>
                </Button>
              </div>
            ) : isVip ? (
              <>
                <Button onClick={() => navigate('/auth')} variant="ghost" className="hidden md:flex hover:text-primary">
                  Se connecter
                </Button>
                <Button onClick={() => navigate('/auth')} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Mon Espace</span>
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/auth')} variant="ghost" className="hidden md:flex hover:text-primary">
                  Se connecter
                </Button>
                <Button 
                  onClick={() => setShowBetaModal(true)} 
                  className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Rejoindre la Bêta</span>
                </Button>
              </>
            )}
            {variant === 'default' && <MobileNav />}
          </div>
        </div>
      </header>

      <BetaWaitlistModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </>
  );
};

export default Header;