import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
 import { Link } from 'react-router-dom';

export function MobileNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
              La Truffe
            </Link>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-auto py-4">
            <div className="space-y-1 px-3">
              <button
                onClick={() => handleNavigate('/')}
                className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Accueil
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Rapports Section */}
              <div className="pt-2">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rapports</p>
                <button
                  onClick={() => handleNavigate('/demo/demo-1')}
                  className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Exemple de rapport
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleNavigate('/pricing')}
                  className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Prix & Abonnements
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleNavigate('/why-us')}
                  className="flex items-center justify-between w-full px-4 py-3 text-left text-primary font-medium rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  Pourquoi nous choisir ?
                  <ChevronRight className="h-4 w-4 text-primary" />
                </button>
              </div>

              {/* Entreprise Section */}
              <div className="pt-4">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entreprise</p>
                <button
                  onClick={() => handleNavigate('/qui-sommes-nous')}
                  className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Qui sommes-nous ?
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleNavigate('/contact')}
                  className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Contact
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-border p-4 space-y-3">
            {user ? (
              <Button 
                onClick={() => handleNavigate('/client-dashboard')} 
                className="w-full gap-2"
              >
                <User className="h-4 w-4" />
                Mon Espace
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => handleNavigate('/auth')} 
                  className="w-full gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Mon Espace
                </Button>
                <Button 
                  onClick={() => handleNavigate('/auth')} 
                  variant="outline"
                  className="w-full"
                >
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}