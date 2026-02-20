import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, user, isAdmin, isRoleLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Récupérer les paramètres query
  const redirectUrl = searchParams.get('redirect');
  const messageText = searchParams.get('message');

  // Redirect based on role when user is logged in and role is resolved
  useEffect(() => {
    if (user && !isRoleLoading) {
      // Si un redirect est spécifié, utiliser celui-ci (ex: /vendre/formulaire)
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/client-dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, isRoleLoading, navigate, redirectUrl]);

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
             <Link to="/" className="font-bold text-2xl md:text-3xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
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
          {/* Afficher le message si fourni */}
          {messageText && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {decodeURIComponent(messageText)}
              </AlertDescription>
            </Alert>
          )}
          
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({
                  variant: "destructive",
                  title: "Erreur",
                  description: "Impossible de se connecter avec Apple.",
                });
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continuer avec Apple
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3 mt-3"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({
                  variant: "destructive",
                  title: "Erreur",
                  description: "Impossible de se connecter avec Google.",
                });
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </Button>
          
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
