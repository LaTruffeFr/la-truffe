import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Composants & UI
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/landing';
import { SellerListings } from '@/components/SellerListings';
import WelcomeModal from '@/components/WelcomeModal';
import ReferralCard from '@/components/dashboard/ReferralCard';
import GarageTab from '@/components/dashboard/GarageTab';
import { 
  LayoutDashboard, Settings, CreditCard, LogOut, 
  Plus, FileText, FolderOpen, User, Shield, Search,
  Loader2, Clock, CheckCircle, Eye, Car, ArrowRight,
  ShieldCheck, Zap, Lock, Bell, Receipt, Download, Scale
} from 'lucide-react';

interface Report {
  id: string;
  marque: string;
  modele: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  prix_affiche: number | null;
  prix_estime: number | null;
  kilometrage: number | null;
  annee: number | null;
  carburant: string | null;
  market_data: any;
  vehicles_data: any;
}

const statusConfig = {
  pending: { label: 'En file d\'attente', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  in_progress: { label: 'Analyse en cours', icon: Loader2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  completed: { label: 'Rapport Prêt', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { user, signOut, isAdmin, credits } = useAuth();
  const { hasUnlimitedCredits } = useVipAccess();
  
  const displayEmail = user?.email || "";
  const initials = displayEmail.substring(0, 2).toUpperCase();

  // NOUVEAU : On ajoute 'settings' et 'billing' aux onglets possibles
  const initialTab = (searchParams.get('tab') as any) || 'reports';
  const [activeTab, setActiveTab] = useState<'reports' | 'listings' | 'garage' | 'settings' | 'billing'>(
    ['reports', 'listings', 'garage', 'settings', 'billing'].includes(initialTab) ? initialTab : 'reports'
  );
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const fetchReports = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('reports')
      .select('id, marque, modele, status, created_at, updated_at, prix_affiche, prix_estime, prix_truffe, kilometrage, annee, carburant, market_data, vehicles_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data as Report[]);
    }
    setIsLoadingReports(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchReports();

    // Show welcome modal for new users (1 credit, never seen before)
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && credits === 1) {
      setShowWelcome(true);
    }
  }, [user, navigate, credits]);

  const handleLogout = async () => {
    await signOut();
    toast({ description: "Déconnexion réussie." });
    navigate('/');
  };

  const handleViewReport = (report: Report) => {
    if (report.status === 'completed') {
      navigate(`/report/${report.id}`);
    } else {
      toast({
        title: "Analyse en cours",
        description: "Notre algorithme d'expertise travaille encore sur ce rapport. Revenez dans quelques minutes.",
      });
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <WelcomeModal open={showWelcome} onClose={handleCloseWelcome} />
      
      {/* --- HEADER CLIENT PREMIUM --- */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="font-black text-2xl tracking-tighter text-foreground hover:opacity-80 transition-opacity flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold border-0">Espace Personnel</Badge>
          </Link>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <div className="font-bold text-foreground text-sm">{displayEmail}</div>
                <div className="text-xs font-medium text-emerald-500 flex items-center justify-end gap-1">
                  <CheckCircle className="w-3 h-3" /> Compte vérifié
                </div>
             </div>
             <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
               <AvatarFallback className="bg-primary/10 text-primary font-black">{initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- SIDEBAR MENU --- */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="rounded-2xl lg:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden">
              
              {/* Wallet & Profil - hidden on mobile, shown on lg */}
              <div className="hidden lg:block bg-slate-900 p-6 lg:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-24 h-24 text-white" /></div>
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm relative z-10 shadow-inner">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="font-bold text-white text-lg truncate relative z-10 mb-1" title={displayEmail}>{displayEmail}</div>
                
                <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm relative z-10">
                   <div className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-1 flex items-center justify-center gap-1">
                     <Zap className="w-3 h-3" /> Crédits IA
                   </div>
                   <div className="text-4xl font-black text-white mb-4">
                     {hasUnlimitedCredits ? '∞' : credits}
                  </div>
                  <Button 
                    className="w-full bg-white text-slate-900 hover:bg-indigo-50 font-bold h-10 rounded-lg shadow-lg"
                    onClick={() => navigate('/pricing')}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Recharger
                  </Button>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="p-2 lg:p-4 flex flex-row lg:flex-col overflow-x-auto gap-1 lg:gap-1 pb-2 lg:pb-4 scrollbar-hide">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="whitespace-nowrap flex-shrink-0 justify-start text-white bg-slate-900 hover:bg-slate-800 hover:text-white font-bold h-10 lg:h-12 rounded-xl lg:mb-4 shadow-md text-xs lg:text-sm"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 text-indigo-400" /> <span className="hidden lg:inline">Tour de Contrôle</span><span className="lg:hidden">Admin</span>
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className={`whitespace-nowrap flex-shrink-0 justify-start h-10 lg:h-12 font-bold rounded-xl text-xs lg:text-sm ${activeTab === 'reports' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> Audits
                </Button>
                
                <Button 
                  variant="ghost" 
                  className={`whitespace-nowrap flex-shrink-0 justify-start h-10 lg:h-12 font-bold rounded-xl text-xs lg:text-sm ${activeTab === 'listings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  onClick={() => setActiveTab('listings')}
                >
                  <Car className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> Annonces
                </Button>
                
                <Button 
                  variant="ghost" 
                  className={`whitespace-nowrap flex-shrink-0 justify-start h-10 lg:h-12 font-bold rounded-xl text-xs lg:text-sm ${activeTab === 'garage' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  onClick={() => setActiveTab('garage')}
                >
                  <Scale className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> Garage
                </Button>
                
                <Button 
                  variant="ghost" 
                  className={`whitespace-nowrap flex-shrink-0 justify-start h-10 lg:h-12 font-bold rounded-xl text-xs lg:text-sm ${activeTab === 'settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> <span className="hidden lg:inline">Paramètres</span><span className="lg:hidden">Config</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className={`whitespace-nowrap flex-shrink-0 justify-start h-10 lg:h-12 font-bold rounded-xl text-xs lg:text-sm ${activeTab === 'billing' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  onClick={() => setActiveTab('billing')}
                >
                  <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> <span className="hidden lg:inline">Facturation</span><span className="lg:hidden">Factures</span>
                </Button>
                
                <div className="hidden lg:block pt-4 mt-2 border-t border-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-12 rounded-xl font-bold"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Se déconnecter
                  </Button>
                </div>
              </nav>
            </Card>
            
            {/* Referral Card - hidden on mobile */}
            <div className="hidden lg:block">
              <ReferralCard />
            </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <div className="lg:col-span-9">
            
            {/* ------------------------------------- */}
            {/* ONGLET 1 : MES AUDITS */}
            {/* ------------------------------------- */}
            {activeTab === 'reports' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">Mes Audits IA</h2>
                  <Button onClick={() => navigate('/audit')} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" /> Nouveau Scan
                  </Button>
                </div>
                
                {isLoadingReports ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                ) : reports.length === 0 ? (
                  <Card className="border-border shadow-sm border-dashed rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <FolderOpen className="w-10 h-10 text-primary/60" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">Aucun audit pour l'instant</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                      Commencez par coller l'URL d'une annonce Leboncoin ou La Centrale pour que l'IA traque les vices cachés.
                    </p>
                    <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-14 px-8 rounded-xl font-bold" onClick={() => navigate('/audit')}>
                      <Search className="w-5 h-5 mr-2" /> Lancer ma première analyse
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {reports.map((report) => {
                      const status = statusConfig[report.status];
                      const StatusIcon = status.icon;
                      const imageUrl = report.market_data?.image_url || (report.vehicles_data?.[0]?.image) || null;
                      return (
                        <Card 
                          key={report.id} 
                          className="border-border shadow-sm bg-card hover:shadow-xl dark:hover:shadow-none hover:border-primary/30 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                          onClick={() => handleViewReport(report)}
                        >
                          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                            <div className="flex items-center gap-5 min-w-0">
                              {imageUrl ? (
                                <img src={imageUrl} alt={report.marque} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0 shadow-sm border border-border group-hover:border-primary/30 transition-colors" />
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30 transition-colors">
                                  <Car className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3 className="font-black text-lg text-foreground truncate mb-1 group-hover:text-primary transition-colors">
                                  {report.marque} {report.modele}
                                </h3>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Expertisé le {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 pl-19 sm:pl-0 mt-2 sm:mt-0">
                              <Badge className={`${status.color} font-bold px-3 py-1.5 rounded-lg border`}>
                                <StatusIcon className={`w-4 h-4 mr-2 ${report.status === 'in_progress' ? 'animate-spin' : ''}`} />
                                {status.label}
                              </Badge>
                              {report.status === 'completed' && (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ------------------------------------- */}
            {/* ONGLET 2 : MES ANNONCES VENDEUR */}
            {/* ------------------------------------- */}
            {activeTab === 'listings' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">Mes Annonces</h2>
                  <Button onClick={() => navigate('/vendre')} className="bg-foreground hover:bg-foreground/90 text-background h-12 px-6 rounded-xl font-bold shadow-lg">
                    <Plus className="w-5 h-5 mr-2" /> Déposer une annonce
                  </Button>
                </div>
                {user && <SellerListings userId={user.id} />}
              </section>
            )}

            {/* ------------------------------------- */}
            {/* ONGLET : MON GARAGE */}
            {/* ------------------------------------- */}
            {activeTab === 'garage' && user && (
              <GarageTab userId={user.id} reports={reports.filter(r => r.status === 'completed')} isLoading={isLoadingReports} />
            )}

            {/* ------------------------------------- */}
            {/* ONGLET 3 : PARAMÈTRES (NOUVEAU) */}
            {/* ------------------------------------- */}
            {activeTab === 'settings' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-6 md:mb-8">Paramètres du Compte</h2>
                
                <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden mb-6 md:mb-8">
                  <div className="bg-muted p-4 md:p-6 border-b border-border flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-black text-base md:text-lg text-foreground">Informations Personnelles</h3>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Gérez vos données de contact.</p>
                    </div>
                  </div>
                  <CardContent className="p-4 md:p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">Adresse Email</Label>
                      <Input value={displayEmail} disabled className="bg-muted font-medium text-muted-foreground" />
                      <p className="text-xs text-slate-400 font-medium mt-1">L'email utilisé pour la connexion ne peut pas être modifié ici.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden mb-6 md:mb-8">
                  <div className="bg-muted p-4 md:p-6 border-b border-border flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center">
                      <Lock className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-black text-base md:text-lg text-foreground">Sécurité</h3>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Mettez à jour votre mot de passe.</p>
                    </div>
                  </div>
                  <CardContent className="p-4 md:p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">Nouveau mot de passe</Label>
                      <Input type="password" placeholder="••••••••" className="font-medium" />
                    </div>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-12 px-8">
                      Mettre à jour la sécurité
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden">
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 md:p-6 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-card rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/30 flex items-center justify-center">
                      <LogOut className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-rose-700">Zone de Danger</h3>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <p className="text-slate-600 font-medium mb-6">La suppression de votre compte est définitive. Toutes vos annonces et vos rapports d'audit seront effacés.</p>
                    <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl h-12 px-8">
                      Supprimer mon compte
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ------------------------------------- */}
            {/* ONGLET 4 : FACTURATION (NOUVEAU) */}
            {/* ------------------------------------- */}
            {activeTab === 'billing' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-6 md:mb-8">Facturation & Crédits</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl bg-slate-900 overflow-hidden text-white relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-32 h-32" /></div>
                    <CardContent className="p-8 relative z-10">
                      <h3 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-2">Offre Actuelle</h3>
                      <div className="text-4xl font-black mb-6">Plan {hasUnlimitedCredits ? 'Illimité' : 'Basic'}</div>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Crédits</p>
                          <p className="text-2xl font-black">{hasUnlimitedCredits ? '∞' : credits}</p>
                        </div>
                      </div>
                      <Button onClick={() => navigate('/pricing')} className="w-full bg-white text-slate-900 hover:bg-indigo-50 font-bold rounded-xl h-12">
                        Passer à l'offre supérieure
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden flex flex-col justify-center">
                    <CardContent className="p-6 md:p-8 text-center">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Moyen de paiement</h3>
                      <p className="text-slate-500 font-medium mb-6">Aucune carte enregistrée. Vous payez à l'usage (Pay-as-you-go).</p>
                      <Button variant="outline" className="font-bold border-slate-200 text-slate-700 rounded-xl h-12 px-8 hover:bg-slate-50">
                        Ajouter une carte
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl md:rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden">
                  <div className="bg-muted p-4 md:p-6 border-b border-border flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center">
                      <Receipt className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-black text-base md:text-lg text-foreground">Historique des transactions</h3>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Retrouvez vos factures.</p>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="text-center py-16 text-slate-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-bold text-lg text-slate-900 mb-1">Aucune transaction</p>
                      <p className="font-medium">Vous n'avez pas encore effectué d'achat sur La Truffe.</p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
