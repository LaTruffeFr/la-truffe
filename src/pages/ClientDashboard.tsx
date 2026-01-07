import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FileText, Clock, CheckCircle, AlertCircle, LogOut, Download, ShoppingCart, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  marque: string;
  modele: string;
  annee_min: number | null;
  annee_max: number | null;
  kilometrage_max: number | null;
  prix_max: number | null;
  carburant: string | null;
  transmission: string | null;
  notes: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  report_url: string | null;
  admin_notes: string | null;
}

const statusConfig = {
  pending: { label: 'En attente de traitement', icon: Clock, color: 'bg-yellow-500' },
  in_progress: { label: 'En cours d\'analyse', icon: AlertCircle, color: 'bg-blue-500' },
  completed: { label: 'Disponible ✅', icon: CheckCircle, color: 'bg-green-500' },
};

const ClientDashboard = () => {
  const { user, signOut, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Simple form - just model name
  const [modelSearch, setModelSearch] = useState('');
  const [notes, setNotes] = useState('');

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch reports
  useEffect(() => {
    if (!user) return;
    
    const fetchReports = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos rapports',
          variant: 'destructive',
        });
      } else {
        setReports(data || []);
      }
      setIsLoading(false);
    };
    
    fetchReports();
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modelSearch.trim()) return;
    
    setIsSubmitting(true);
    
    // Parse model search (e.g., "Golf 7" -> marque: "Volkswagen", modele: "Golf 7")
    const searchTerm = modelSearch.trim();
    
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      marque: searchTerm.split(' ')[0] || searchTerm,
      modele: searchTerm,
      notes: notes || null,
    });
    
    if (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la demande',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Demande envoyée !',
        description: 'Vous recevrez votre rapport sous 24-48h',
      });
      setIsDialogOpen(false);
      setModelSearch('');
      setNotes('');
      // Refresh reports
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      setReports(data || []);
    }
    
    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/76765751-c461-4096-a57b-30bb3f498569.png" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-xl font-bold">Auto Sniper</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:block">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Commander un rapport */}
        <section>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Commander un rapport
              </CardTitle>
              <CardDescription>
                Dites-nous quel modèle vous cherchez et recevez un rapport détaillé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Commander l'audit (19€)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Commander un rapport</DialogTitle>
                    <DialogDescription>
                      Quel modèle cherchez-vous ? (ex: Golf 7, 308 GTi, Clio 4...)
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Modèle recherché *</Label>
                      <Input
                        id="model"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Ex: Golf 7 TDI 150"
                        required
                        className="text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Précisions (optionnel)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Budget, année souhaitée, kilométrage max, couleur..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Rapport d'analyse</span>
                        <span className="text-xl font-bold text-primary">19€</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vous recevrez votre rapport sous 24-48h avec les meilleures opportunités du marché.
                      </p>
                    </div>
                    
                    <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Commander (19€)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Le paiement sera demandé à l'étape suivante
                    </p>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Mes Rapports */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Mes Rapports</h2>
              <p className="text-muted-foreground">Historique de vos demandes</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun rapport</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore commandé de rapport
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Commander mon premier rapport
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => {
                const StatusIcon = statusConfig[report.status].icon;
                return (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {report.modele}
                          </CardTitle>
                          <CardDescription>
                            Commandé le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusConfig[report.status].color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[report.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {report.notes && (
                        <p className="text-sm text-muted-foreground mb-4 italic">
                          "{report.notes}"
                        </p>
                      )}
                      
                      {report.status === 'completed' && report.report_url && (
                        <Button 
                          onClick={() => window.open(report.report_url!, '_blank')}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger le PDF
                        </Button>
                      )}
                      
                      {report.admin_notes && report.status === 'completed' && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Note de l'équipe :</p>
                          <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                        </div>
                      )}
                      
                      {report.status === 'pending' && (
                        <p className="text-sm text-muted-foreground">
                          Votre demande sera traitée sous 24-48h
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ClientDashboard;
