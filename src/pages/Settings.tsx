import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, Settings as SettingsIcon, CreditCard, LogOut, 
  User, Lock, Bell, Save
} from 'lucide-react';
import { Footer } from '@/components/landing';
import logoTruffe from '@/assets/logo-latruffe.png';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  const currentUser = user || { email: "client@latruffe.com", type: "Individuel", credits: 0, initials: "CL", name: "Client La Truffe" };

  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation de sauvegarde
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Modifications enregistrées", description: "Votre profil a été mis à jour." });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoTruffe} alt="Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold">La Truffe</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-sm text-right hidden sm:block">
                <div className="font-bold">{currentUser.email}</div>
                <div className="text-xs text-slate-500">{currentUser.type}</div>
             </div>
             <Avatar className="h-9 w-9 border border-slate-200 bg-white">
               <AvatarFallback className="bg-primary text-white font-bold text-xs">{currentUser.initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-sm truncate px-2">{currentUser.email}</div>
              </div>
              <nav className="p-2 space-y-1">
                <Button variant="ghost" onClick={() => navigate('/client-dashboard')} className="w-full justify-start text-slate-600 hover:text-primary hover:bg-slate-50 h-10">
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Mes rapports
                </Button>
                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5 font-semibold h-10">
                  <SettingsIcon className="w-4 h-4 mr-3" /> Paramètres
                </Button>
                <Button variant="ghost" onClick={() => navigate('/transactions')} className="w-full justify-start text-slate-600 hover:text-primary hover:bg-slate-50 h-10">
                  <CreditCard className="w-4 h-4 mr-3" /> Transactions
                </Button>
                <Separator className="my-2" />
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-10">
                  <LogOut className="w-4 h-4 mr-3" /> Déconnexion
                </Button>
              </nav>
            </Card>
          </aside>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-9 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Paramètres du compte</h2>

            {/* Section Profil */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Informations personnelles</CardTitle>
                <CardDescription>Gérez vos informations de base.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input defaultValue={currentUser.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue={currentUser.email} disabled className="bg-slate-100 text-slate-500" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                      {isLoading ? "Enregistrement..." : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Section Sécurité */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> Sécurité</CardTitle>
                <CardDescription>Modifiez votre mot de passe.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nouveau mot de passe</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmer le mot de passe</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline">Mettre à jour le mot de passe</Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Notifications */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Préférences</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Emails marketing</Label>
                    <p className="text-sm text-slate-500">Recevoir des offres et des astuces.</p>
                  </div>
                  <Button variant="outline" size="sm">Désactiver</Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;