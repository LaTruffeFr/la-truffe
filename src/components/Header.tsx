import { Search, Zap, LogOut, User, Settings, HelpCircle, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
  };

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center gold-glow group-hover:scale-105 transition-transform duration-300">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold tracking-tight">
                La Truffe
              </h1>
              <p className="text-xs text-muted-foreground">Car Flipping Desk</p>
            </div>
          </div>
          
          {/* Center - Status */}
          <div className="hidden md:flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 cursor-help">
                    <div className="relative">
                      <Zap className="w-4 h-4 text-success" />
                      <div className="absolute inset-0 animate-ping opacity-30">
                        <Zap className="w-4 h-4 text-success" />
                      </div>
                    </div>
                    <span className="text-sm text-success font-medium">Live Analysis</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Opportunités mises à jour quotidiennement</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aide</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${isAdmin ? 'bg-primary/30 ring-primary/40' : 'bg-primary/20 ring-primary/20'}`}>
                      {isAdmin ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="hidden lg:inline text-sm text-muted-foreground max-w-32 truncate">
                      {user.email}
                    </span>
                    {isAdmin && (
                      <Badge variant="outline" className="hidden md:flex text-xs bg-primary/10 text-primary border-primary/30">
                        Admin
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Mon compte</p>
                        {isAdmin && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
