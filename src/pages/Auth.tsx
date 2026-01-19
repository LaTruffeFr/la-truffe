import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ✅ CORRECTION ICI : Ajout du "s" à contexts et chemin relatif sûr
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation de délai réseau
    setTimeout(() => {
      login(email);
      setLoading(false);
      navigate('/client-dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="font-logo font-bold text-2xl tracking-tight text-slate-900">La Truffe</Link>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Bienvenue sur La Truffe</CardTitle>
          <CardDescription>
            Entrez votre email pour vous connecter ou créer un compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="nom@exemple.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? "Connexion..." : "Continuer avec Email"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;