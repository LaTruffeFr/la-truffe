import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus, FileText, FolderOpen, User, Link2, Shield,
  Loader2, Clock, CheckCircle, Eye, AlertCircle, ExternalLink, Car
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { useAuth } from '@/hooks/useAuth';
import { useVipAccess } from '@/hooks/useVipAccess';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { SellerListings } from '@/components/SellerListings';

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
  
  const { user, signOut, isAdmin, credits, userEmail, refreshCredits } = useAuth();
  const { isVip, hasUnlimitedCredits } = useVipAccess();
  
  const displayEmail = userEmail || user?.email || "";
  const initials = displayEmail.substring(0, 2).toUpperCase();

  const [activeTab, setActiveTab] = useState<'reports' | 'listings'>('reports');
  const [listingUrl, setListingUrl] = useState('');
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

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast({ description: "Déconnexion réussie." });
    navigate('/');
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = listingUrl.trim();
    if (!trimmedUrl) {
      toast({ variant: "destructive", title: "Lien manquant", description: "Collez le lien d'une annonce." });
      return;
    }

    const supportedDomains = ['leboncoin.fr', 'lacentrale.fr', 'autoscout24.fr', 'autoscout24.com'];
    try {
      const parsed = new URL(trimmedUrl);
      if (!supportedDomains.some(d => parsed.hostname.includes(d))) {
        toast({ variant: "destructive", title: "Site non supporté", description: "Seuls LeBonCoin, La Centrale et AutoScout24 sont supportés." });
        return;
      }
    } catch {
      toast({ variant: "destructive", title: "URL invalide", description: "Veuillez entrer une URL valide." });
      return;
    }

    if (!user) { navigate('/auth'); return; }

    setIsSubmitting(true);
    try {
      // Appeler la edge function audit-url qui scrape + analyse IA + sauvegarde
      const { data, error } = await supabase.functions.invoke('audit-url', {
        body: { url: trimmedUrl },
      });

      if (error) throw new Error(error.message || "Erreur lors de l'appel à l'audit");
      
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Analyse terminée ! ✅",
        description: "Votre rapport d'audit est prêt. Cliquez dessus pour le consulter.",
        className: "bg-green-600 text-white border-0",
      });

      setListingUrl('');
      fetchReports();
      
      // Naviguer directement vers le rapport si on a l'ID
      if (data?.reportId) {
        navigate(`/report/${data.reportId}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'analyser l'annonce. Réessayez.",
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
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
            La Truffe
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="text-sm text-right hidden sm:block">
                <div className="font-bold text-foreground text-xs sm:text-sm truncate max-w-[150px] md:max-w-none">{displayEmail}</div>
                <div className="text-xs text-muted-foreground">Individuel</div>
             </div>
             <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border">
               <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">{initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          
          {/* --- SIDEBAR (Hidden on mobile, shown as row on tablet, column on desktop) --- */}
          <aside className="lg:col-span-3 space-y-4 md:space-y-6">
            <Card className="border-border shadow-sm bg-card overflow-hidden">
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-foreground text-sm truncate" title={displayEmail}>{displayEmail}</div>
                <div className="text-xs text-muted-foreground mb-6">Individuel</div>
                
                <div className="bg-muted rounded-xl p-4 border border-border">
                   <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Crédits restants</div>
                   <div className={`text-3xl font-bold mb-3 ${hasUnlimitedCredits ? 'text-primary' : credits === 0 ? 'text-destructive' : 'text-primary'}`}>
                     {hasUnlimitedCredits ? '∞' : credits}
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
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-10 font-semibold ${activeTab === 'reports' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Mes rapports
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-10 font-semibold ${activeTab === 'listings' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
                  onClick={() => setActiveTab('listings')}
                >
                  <Car className="w-4 h-4 mr-3" /> Mes annonces
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
          <div className="lg:col-span-9 space-y-6 md:space-y-8">
            {activeTab === 'reports' ? (
              <>
                <section>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Analyser une annonce</h2>
              
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-medium text-slate-700 flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Collez le lien de l'annonce
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmitLink} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="listingUrl" className="text-sm font-semibold text-slate-700">Lien de l'annonce *</Label>
                      <Input 
                        id="listingUrl"
                        type="url"
                        placeholder="https://www.leboncoin.fr/voitures/..." 
                        className="h-12 text-base bg-slate-50 border-slate-200 focus:border-primary"
                        value={listingUrl}
                        onChange={(e) => setListingUrl(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-normal">LeBonCoin</Badge>
                        <Badge variant="secondary" className="text-xs font-normal">La Centrale</Badge>
                        <Badge variant="secondary" className="text-xs font-normal">AutoScout24</Badge>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full md:w-auto h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-md"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyse en cours...</>
                        ) : (
                          <><ExternalLink className="w-4 h-4 mr-2" /> Lancer l'audit</>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> L'analyse IA est instantanée (10-30 secondes).
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
                        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 truncate">
                                {report.marque} {report.modele}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-500">
                                Demandé le {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-12 sm:pl-0">
                            <Badge className={`${status.color} border font-medium text-xs`}>
                              <StatusIcon className={`w-3 h-3 mr-1 sm:mr-1.5 ${report.status === 'in_progress' ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline">{status.label}</span>
                              <span className="sm:hidden">{status.label.split(' ')[0]}</span>
                            </Badge>
                            {report.status === 'completed' && (
                              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 h-8 px-2 sm:px-3">
                                <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Voir</span>
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
              </>
            ) : (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Mes annonces</h2>
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
