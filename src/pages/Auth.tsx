import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
 import { Link } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, isAdmin, isRoleLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect based on role when user is logged in and role is resolved
  useEffect(() => {
    if (user && !isRoleLoading) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/client-dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, isRoleLoading, navigate]);

  // Show loading while checking role
  if (user && isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification de votre compte...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is logged in (redirect is pending)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: "destructive",
              title: "Compte existant",
              description: "Un compte existe déjà avec cet email. Essayez de vous connecter.",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Compte créé !",
            description: "Vous pouvez maintenant vous connecter.",
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect.",
          });
        } else {
          toast({
            title: "Bienvenue !",
            description: "Connexion réussie.",
          });
          // Redirection is handled by useEffect based on role
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <Link to="/" className="font-logo font-bold text-3xl tracking-tight text-foreground">
               La Truffe
             </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? "Créer un compte" : "Bienvenue sur La Truffe"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Entrez vos informations pour créer votre compte" 
              : "Entrez vos identifiants pour vous connecter"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="nom@exemple.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isSignUp ? (
                "Créer mon compte"
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp 
                ? "Déjà un compte ? Se connecter" 
                : "Pas de compte ? S'inscrire"
              }
            </button>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
