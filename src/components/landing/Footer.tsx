import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 text-center md:text-left md:flex-row md:justify-between">
          {/* Logo Text */}
          <Link to="/" className="flex items-center gap-3">
            <span className="font-logo font-bold text-xl md:text-2xl tracking-tight text-slate-900">La Truffe</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link 
              to="/contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link 
              to="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mentions Légales
            </Link>
            <Link 
              to="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              CGV
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-xs md:text-sm">
            © 2026 La Truffe. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
