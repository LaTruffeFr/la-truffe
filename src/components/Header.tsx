import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  activeLink?: 'home' | 'audit' | 'marketplace' | 'vendre' | 'cote' | 'pricing' | 'about' | 'contact' | 'why-us';
}

export const Header = ({ activeLink }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Effet pour rendre le header légèrement transparent au scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Scanner une annonce', path: '/audit', id: 'audit' },
    { name: 'Marketplace', path: '/marketplace', id: 'marketplace' },
    { name: 'Cote Auto', path: '/cote', id: 'cote' },
    { name: 'Vendre', path: '/vendre', id: 'vendre' },
    { name: 'Tarifs', path: '/pricing', id: 'pricing' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-3' 
          : 'bg-white border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-black text-2xl tracking-tighter text-slate-900 hover:opacity-80 transition-opacity"
          >
            <BrainCircuit className="w-7 h-7 text-indigo-600" />
            La Truffe
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.id} 
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeLink === link.id 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* AUTH BUTTONS (DESKTOP) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button 
                onClick={() => navigate('/client')} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-10 px-5"
              >
                <User className="w-4 h-4 mr-2" /> Mon Espace
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/auth')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-5 shadow-lg shadow-indigo-200"
              >
                Se connecter
              </Button>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link 
              key={link.id} 
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-4 rounded-xl text-base font-bold ${
                activeLink === link.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-px bg-slate-100 my-2" />
          
          {user ? (
            <Button 
              onClick={() => { navigate('/client'); setIsMobileMenuOpen(false); }} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-12"
            >
              <User className="w-5 h-5 mr-2" /> Mon Espace
            </Button>
          ) : (
            <Button 
              onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12"
            >
              Se connecter
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
