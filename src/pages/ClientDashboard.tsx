import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, Settings, CreditCard, LogOut, 
  Plus, FileText, FolderOpen, User, Search
} from 'lucide-react';
import { Footer } from '@/components/landing';

// ✅ CORRECTION ICI : Ajout du "s" à "contexts" pour correspondre à ton dossier
import { useAuth } from '../contexts/AuthContext';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Récupération du contexte
  const { user, logout } = useAuth();
  
  // Sécurité anti-crash si le user est null
  const currentUser = user || {
    email: "client@latruffe.com",
    type: "Individuel",
    credits: 0, 
    initials: "CL"
  };

  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [precision, setPrecision] = useState('');

  const handleLogout = () => {
    logout();
    toast({ description: "Déconnexion réussie." });
    navigate('/');
  };

  const handleNavigation = (path: string, featureName: string) => {
    if (path === '#') {
      toast({ 
        title: "Bientôt disponible", 
        description: `La section ${featureName} arrive prochainement.` 
      });
    } else {
      navigate(path);
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!marque || !modele) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez entrer au moins une marque et un modèle.",
      });
      return;
    }

    if (currentUser.credits === 0) {
      toast({
        variant: "destructive",
        title: "Crédits insuffisants",
        description: "Vous devez recharger vos crédits pour lancer une analyse.",
      });
      navigate('/pricing');
    } else {
      toast({
        title: "Analyse lancée !",
        description: "Votre rapport est en cours de génération...",
      });
      navigate('/audit/demo-1');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-logo font-bold text-2xl tracking-tight text-slate-900">
            La Truffe
          </Link>
          <div className="flex items-center gap-3">
             <div className="text-sm text-right hidden sm:block">
                <div className="font-bold text-slate-900 text-xs sm:text-sm">{currentUser.email}</div>
                <div className="text-xs text-slate-500">{currentUser.type}</div>
             </div>
             <Avatar className="h-9 w-9 border border-slate-200">
               <AvatarFallback className="bg-primary text-white font-bold text-xs">{currentUser.initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-slate-900 text-sm truncate" title={currentUser.email}>{currentUser.email}</div>
                <div className="text-xs text-slate-500 mb-6">{currentUser.type}</div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Crédits restants</div>
                  <div className={`text-3xl font-bold mb-3 ${currentUser.credits === 0 ? 'text-red-500' : 'text-primary'}`}>
                    {currentUser.credits}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-9 text-xs shadow-md"
                    onClick={() => navigate('/pricing')}
                  >
                    <Plus className="w-3 h-3 mr-1.5" /> Obtenir plus
                  </Button>
                </div>
              </div>
              
              <nav className="p-2 space-y-1">
                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5 font-semibold h-10">
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Mes rapports
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 hover:text-primary hover:bg-slate-50 h-10"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-3" /> Paramètres
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 hover:text-primary hover:bg-slate-50 h-10"
                  onClick={() => navigate('/transactions')}
                >
                  <CreditCard className="w-4 h-4 mr-3" /> Transactions
                </Button>
                <Separator className="my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" /> Déconnexion
                </Button>
              </nav>
            </Card>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <div className="lg:col-span-9 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Générer un nouveau rapport</h2>
              
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-medium text-slate-700 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Critères du véhicule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleGenerateReport} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="marque" className="text-sm font-semibold text-slate-700">Marque</Label>
                        <Input 
                          id="marque"
                          placeholder="Ex: Audi, BMW..." 
                          className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                          value={marque}
                          onChange={(e) => setMarque(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modele" className="text-sm font-semibold text-slate-700">Modèle</Label>
                        <Input 
                          id="modele"
                          placeholder="Ex: A3, Serie 1..." 
                          className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                          value={modele}
                          onChange={(e) => setModele(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precision" className="text-sm font-semibold text-slate-700">Précision (Année, Finition...)</Label>
                      <Input 
                        id="precision"
                        placeholder="Ex: 2020, S-Line..." 
                        className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                        value={precision}
                        onChange={(e) => setPrecision(e.target.value)}
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" size="lg" className="w-full md:w-auto h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-md">
                        Lancer l'analyse de marché
                      </Button>
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Cette action consommera 1 crédit.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Ma liste de rapports</h2>
              <Card className="border-slate-200 shadow-sm border-dashed min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                  <FolderOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Tu n'as pas encore de rapports</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Commencez par lancer une analyse de véhicule ci-dessus. Vos rapports apparaîtront ici une fois le calcul terminé.
                </p>
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <Plus className="w-4 h-4 mr-2" /> Créer mon premier rapport
                </Button>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;