import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FileText, Clock, CheckCircle, AlertCircle, LogOut, Download } from 'lucide-react';
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
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  in_progress: { label: 'En cours', icon: AlertCircle, color: 'bg-blue-500' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'bg-green-500' },
};

const ClientDashboard = () => {
  const { user, signOut, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    annee_min: '',
    annee_max: '',
    kilometrage_max: '',
    prix_max: '',
    carburant: '',
    transmission: '',
    notes: '',
  });

  // Redirect admin to admin page
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

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
    if (!user) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      marque: formData.marque,
      modele: formData.modele,
      annee_min: formData.annee_min ? parseInt(formData.annee_min) : null,
      annee_max: formData.annee_max ? parseInt(formData.annee_max) : null,
      kilometrage_max: formData.kilometrage_max ? parseInt(formData.kilometrage_max) : null,
      prix_max: formData.prix_max ? parseInt(formData.prix_max) : null,
      carburant: formData.carburant || null,
      transmission: formData.transmission || null,
      notes: formData.notes || null,
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
      setFormData({
        marque: '',
        modele: '',
        annee_min: '',
        annee_max: '',
        kilometrage_max: '',
        prix_max: '',
        carburant: '',
        transmission: '',
        notes: '',
      });
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

  const handleDownloadReport = async (reportUrl: string) => {
    window.open(reportUrl, '_blank');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
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
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mes Rapports</h1>
            <p className="text-muted-foreground">Gérez vos demandes de recherche de véhicules</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle demande de rapport</DialogTitle>
                <DialogDescription>
                  Décrivez le véhicule que vous recherchez et nous vous enverrons un rapport détaillé.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marque">Marque *</Label>
                    <Input
                      id="marque"
                      value={formData.marque}
                      onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                      placeholder="Ex: Peugeot"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modele">Modèle *</Label>
                    <Input
                      id="modele"
                      value={formData.modele}
                      onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                      placeholder="Ex: 308"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annee_min">Année min</Label>
                    <Input
                      id="annee_min"
                      type="number"
                      value={formData.annee_min}
                      onChange={(e) => setFormData({ ...formData, annee_min: e.target.value })}
                      placeholder="Ex: 2018"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annee_max">Année max</Label>
                    <Input
                      id="annee_max"
                      type="number"
                      value={formData.annee_max}
                      onChange={(e) => setFormData({ ...formData, annee_max: e.target.value })}
                      placeholder="Ex: 2023"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kilometrage_max">Kilométrage max</Label>
                    <Input
                      id="kilometrage_max"
                      type="number"
                      value={formData.kilometrage_max}
                      onChange={(e) => setFormData({ ...formData, kilometrage_max: e.target.value })}
                      placeholder="Ex: 100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prix_max">Budget max (€)</Label>
                    <Input
                      id="prix_max"
                      type="number"
                      value={formData.prix_max}
                      onChange={(e) => setFormData({ ...formData, prix_max: e.target.value })}
                      placeholder="Ex: 15000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carburant">Carburant</Label>
                    <Select 
                      value={formData.carburant} 
                      onValueChange={(value) => setFormData({ ...formData, carburant: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essence">Essence</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybride">Hybride</SelectItem>
                        <SelectItem value="electrique">Électrique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select 
                      value={formData.transmission} 
                      onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manuelle">Manuelle</SelectItem>
                        <SelectItem value="automatique">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes additionnelles</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Précisions sur votre recherche (couleur, options, localisation préférée...)"
                    rows={3}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer ma demande'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports List */}
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
                Vous n'avez pas encore fait de demande de rapport
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Faire ma première demande
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
                          {report.marque} {report.modele}
                        </CardTitle>
                        <CardDescription>
                          Demande du {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <Badge className={`${statusConfig[report.status].color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[report.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {report.annee_min && (
                        <div>
                          <span className="text-muted-foreground">Année:</span>{' '}
                          {report.annee_min}{report.annee_max ? ` - ${report.annee_max}` : '+'}
                        </div>
                      )}
                      {report.kilometrage_max && (
                        <div>
                          <span className="text-muted-foreground">Km max:</span>{' '}
                          {report.kilometrage_max.toLocaleString('fr-FR')} km
                        </div>
                      )}
                      {report.prix_max && (
                        <div>
                          <span className="text-muted-foreground">Budget:</span>{' '}
                          {report.prix_max.toLocaleString('fr-FR')} €
                        </div>
                      )}
                      {report.carburant && (
                        <div>
                          <span className="text-muted-foreground">Carburant:</span>{' '}
                          {report.carburant}
                        </div>
                      )}
                    </div>
                    
                    {report.notes && (
                      <p className="text-sm text-muted-foreground mt-3 italic">
                        "{report.notes}"
                      </p>
                    )}
                    
                    {report.status === 'completed' && report.report_url && (
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleDownloadReport(report.report_url!)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le rapport
                        </Button>
                      </div>
                    )}
                    
                    {report.admin_notes && report.status === 'completed' && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Note de l'équipe :</p>
                        <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
