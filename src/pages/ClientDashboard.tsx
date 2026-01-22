import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, Settings, CreditCard, LogOut, 
  Plus, FileText, FolderOpen, User, Search, Shield,
  Loader2, Clock, CheckCircle, Eye, AlertCircle
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Report {
  id: string;
  marque: string;
  modele: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'En cours', icon: Loader2, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { user, signOut, isAdmin, credits, userEmail } = useAuth();
  
  const displayEmail = userEmail || user?.email || "client@latruffe.com";
  const initials = displayEmail.substring(0, 2).toUpperCase();

  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [precision, setPrecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Vérifier s'il y a une demande en attente après connexion
  useEffect(() => {
    if (!user) return;

    const pendingAudit = sessionStorage.getItem('pendingAudit');
    if (pendingAudit) {
      sessionStorage.removeItem('pendingAudit');
      const { marque, modele } = JSON.parse(pendingAudit);
      
      // Créer automatiquement la demande
      const createPendingReport = async () => {
        const { error } = await supabase.from('reports').insert({
          user_id: user.id,
          marque,
          modele,
          status: 'pending',
        });

        if (!error) {
          toast({
            title: "Demande envoyée !",
            description: `Votre demande d'audit pour ${marque} ${modele} a été soumise.`,
          });
          fetchReports();
        }
      };
      
      createPendingReport();
    } else {
      fetchReports();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast({ description: "Déconnexion réussie." });
    navigate('/');
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!marque.trim() || !modele.trim()) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez entrer au moins une marque et un modèle.",
      });
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        user_id: user.id,
        marque: marque.trim(),
        modele: modele.trim(),
        notes: precision.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Votre demande d'audit a été soumise. Vous recevrez votre rapport sous 24h.",
      });

      // Réinitialiser le formulaire et recharger les rapports
      setMarque('');
      setModele('');
      setPrecision('');
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre votre demande. Réessayez.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReport = (report: Report) => {
    if (report.status === 'completed') {
      navigate(`/report/${report.id}`);
    } else {
      toast({
        title: "Rapport en cours",
        description: "Ce rapport n'est pas encore prêt. Revenez plus tard.",
      });
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
                <div className="font-bold text-foreground text-xs sm:text-sm">{displayEmail}</div>
                <div className="text-xs text-muted-foreground">Individuel</div>
             </div>
             <Avatar className="h-9 w-9 border border-border">
               <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">{initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="border-border shadow-sm bg-card overflow-hidden">
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-foreground text-sm truncate" title={displayEmail}>{displayEmail}</div>
                <div className="text-xs text-muted-foreground mb-6">Individuel</div>
                
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Crédits restants</div>
                  <div className={`text-3xl font-bold mb-3 ${credits === 0 ? 'text-destructive' : 'text-primary'}`}>
                    {credits}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-xs shadow-md"
                    onClick={() => navigate('/pricing')}
                  >
                    <Plus className="w-3 h-3 mr-1.5" /> Obtenir plus
                  </Button>
                </div>
              </div>
              
              <nav className="p-2 space-y-1">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold h-10"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield className="w-4 h-4 mr-3" /> Espace Admin
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5 font-semibold h-10">
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Mes rapports
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted h-10"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-3" /> Paramètres
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted h-10"
                  onClick={() => navigate('/transactions')}
                >
                  <CreditCard className="w-4 h-4 mr-3" /> Transactions
                </Button>
                <Separator className="my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Demander un audit de prix</h2>
              
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-medium text-slate-700 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Quel véhicule recherchez-vous ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleGenerateReport} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="marque" className="text-sm font-semibold text-slate-700">Marque *</Label>
                        <Input 
                          id="marque"
                          placeholder="Ex: Audi, BMW..." 
                          className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                          value={marque}
                          onChange={(e) => setMarque(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modele" className="text-sm font-semibold text-slate-700">Modèle *</Label>
                        <Input 
                          id="modele"
                          placeholder="Ex: A3, Serie 1..." 
                          className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                          value={modele}
                          onChange={(e) => setModele(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precision" className="text-sm font-semibold text-slate-700">Précision (Année, Finition...)</Label>
                      <Input 
                        id="precision"
                        placeholder="Ex: 2020, S-Line, Diesel..." 
                        className="h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary"
                        value={precision}
                        onChange={(e) => setPrecision(e.target.value)}
                      />
                    </div>
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full md:w-auto h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-md"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Envoi en cours...</>
                        ) : (
                          <>Envoyer ma demande</>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Notre équipe analysera votre demande et vous enverra le rapport sous 24h.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Mes demandes d'audit</h2>
              
              {isLoadingReports ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : reports.length === 0 ? (
                <Card className="border-slate-200 shadow-sm border-dashed min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                    <FolderOpen className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune demande pour l'instant</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Commencez par envoyer une demande d'audit ci-dessus. Vos rapports apparaîtront ici une fois traités.
                  </p>
                  <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Plus className="w-4 h-4 mr-2" /> Créer ma première demande
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const status = statusConfig[report.status];
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card 
                        key={report.id} 
                        className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewReport(report)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-slate-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {report.marque} {report.modele}
                              </h3>
                              <p className="text-sm text-slate-500">
                                Demandé le {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={`${status.color} border font-medium`}>
                              <StatusIcon className={`w-3 h-3 mr-1.5 ${report.status === 'in_progress' ? 'animate-spin' : ''}`} />
                              {status.label}
                            </Badge>
                            {report.status === 'completed' && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <Eye className="w-4 h-4" /> Voir
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
