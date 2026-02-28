import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Composants & UI
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/landing';
import { SellerListings } from '@/components/SellerListings';
import { 
  LayoutDashboard, Settings, CreditCard, LogOut, 
  Plus, FileText, FolderOpen, User, Shield,
  Loader2, Clock, CheckCircle, Eye, Car, ArrowRight,
  BrainCircuit, Zap
} from 'lucide-react';

interface Report {
  id: string;
  marque: string;
  modele: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'En file d\'attente', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  in_progress: { label: 'Analyse IA', icon: Loader2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  completed: { label: 'Rapport Prêt', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { user, signOut, isAdmin, credits } = useAuth();
  const { hasUnlimitedCredits } = useVipAccess();
  
  const displayEmail = user?.email || "";
  const initials = displayEmail.substring(0, 2).toUpperCase();

  const [activeTab, setActiveTab] = useState<'reports' | 'listings'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Charger les rapports de l'utilisateur
  const fetchReports = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('reports')
      .select('id, marque, modele, status, created_at, updated_at')
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
  }, [user, navigate]);

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
        description: "Le Cerveau Hybride travaille encore sur ce rapport. Revenez dans quelques minutes.",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER CLIENT PREMIUM --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="font-black text-2xl tracking-tighter text-slate-900 hover:opacity-80 transition-opacity flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-0">Espace Client</Badge>
          </Link>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <div className="font-bold text-slate-900 text-sm">{displayEmail}</div>
                <div className="text-xs font-medium text-emerald-500 flex items-center justify-end gap-1">
                  <CheckCircle className="w-3 h-3" /> Compte vérifié
                </div>
             </div>
             <Avatar className="h-10 w-10 border-2 border-indigo-100 shadow-sm">
               <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black">{initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- SIDEBAR MENU --- */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="rounded-[2rem] border-slate-100 shadow-xl bg-white overflow-hidden">
              
              {/* Wallet & Profil */}
              <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-24 h-24 text-white" /></div>
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm relative z-10">
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
              <nav className="p-4 space-y-1">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white bg-slate-900 hover:bg-slate-800 hover:text-white font-bold h-12 rounded-xl mb-4 shadow-md"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield className="w-5 h-5 mr-3 text-indigo-400" /> Tour de Contrôle Admin
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-12 font-bold rounded-xl ${activeTab === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" /> Historique des Audits
                </Button>
                
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-12 font-bold rounded-xl ${activeTab === 'listings' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  onClick={() => setActiveTab('listings')}
                >
                  <Car className="w-5 h-5 mr-3" /> Mes annonces (Vendeur)
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-12 rounded-xl font-bold"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-5 h-5 mr-3" /> Paramètres
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-12 rounded-xl font-bold"
                  onClick={() => navigate('/transactions')}
                >
                  <CreditCard className="w-5 h-5 mr-3" /> Facturation
                </Button>
                
                <div className="pt-4 mt-2 border-t border-slate-100">
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
          </aside>

          {/* --- MAIN CONTENT --- */}
          <div className="lg:col-span-9">
            {activeTab === 'reports' ? (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mes Audits IA</h2>
                  <Button onClick={() => navigate('/audit')} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-200">
                    <Plus className="w-5 h-5 mr-2" /> Nouveau Scan
                  </Button>
                </div>
                
                {isLoadingReports ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  </div>
                ) : reports.length === 0 ? (
                  <Card className="border-slate-200 shadow-sm border-dashed rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <FolderOpen className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Aucun audit pour l'instant</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                      Commencez par coller l'URL d'une annonce Leboncoin ou La Centrale pour que l'IA traque les vices cachés.
                    </p>
                    <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 rounded-xl font-bold" onClick={() => navigate('/audit')}>
                      <BrainCircuit className="w-5 h-5 mr-2" /> Lancer ma première analyse
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {reports.map((report) => {
                      const status = statusConfig[report.status];
                      const StatusIcon = status.icon;
                      
                      return (
                        <Card 
                          key={report.id} 
                          className="border-slate-100 shadow-sm bg-white hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                          onClick={() => handleViewReport(report)}
                        >
                          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                            <div className="flex items-center gap-5 min-w-0">
                              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors border border-slate-100 group-hover:border-indigo-600">
                                <FileText className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-lg text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                  {report.marque} {report.modele}
                                </h3>
                                <p className="text-sm font-medium text-slate-500">
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
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
                                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
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
            ) : (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mes Annonces (Vendeur)</h2>
                  <Button onClick={() => navigate('/vendre')} className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-6 rounded-xl font-bold shadow-lg">
                    <Plus className="w-5 h-5 mr-2" /> Déposer une annonce
                  </Button>
                </div>
                {user && <SellerListings userId={user.id} />}
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
