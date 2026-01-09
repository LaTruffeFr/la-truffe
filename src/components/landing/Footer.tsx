import { Link } from 'react-router-dom';
import logoLatruffe from '@/assets/logo-latruffe.png';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logoLatruffe}
              alt="Logo La Truffe" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-foreground">La Truffe</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link 
              to="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link 
              to="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Mentions Légales
            </Link>
            <Link 
              to="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              CGV
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © 2026 La Truffe. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
