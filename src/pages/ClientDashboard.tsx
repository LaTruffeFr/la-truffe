import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, FileText, Clock, CheckCircle, AlertCircle, 
  Search, User, CreditCard, Settings, Receipt, Car, FolderOpen,
  ArrowRight, Calendar, Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import logoTruffe from '@/assets/logo-truffe.jpg';

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

// Mock data for demonstration
const mockReports: Omit<Report, 'user_id'>[] = [
  {
    id: '1',
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-12T10:00:00Z',
    marque: 'BMW',
    modele: 'X5 xDrive',
    annee_min: 2018,
    annee_max: 2020,
    kilometrage_max: 80000,
    prix_max: 45000,
    carburant: 'Diesel',
    transmission: 'Automatique',
    notes: null,
    status: 'completed',
    report_url: '/report/1',
    admin_notes: 'Excellent choix, plusieurs opportunités trouvées',
  },
  {
    id: '2',
    created_at: '2025-01-10T14:30:00Z',
    updated_at: '2025-01-10T14:30:00Z',
    marque: 'Mercedes',
    modele: 'Classe C 220d',
    annee_min: 2019,
    annee_max: 2021,
    kilometrage_max: 60000,
    prix_max: 35000,
    carburant: 'Diesel',
    transmission: 'Automatique',
    notes: 'Recherche berline confortable',
    status: 'completed',
    report_url: '/report/2',
    admin_notes: null,
  },
  {
    id: '3',
    created_at: '2025-01-08T09:15:00Z',
    updated_at: '2025-01-08T09:15:00Z',
    marque: 'Audi',
    modele: 'A4 Avant',
    annee_min: 2020,
    annee_max: 2022,
    kilometrage_max: 50000,
    prix_max: 40000,
    carburant: 'Essence',
    transmission: 'Automatique',
    notes: null,
    status: 'in_progress',
    report_url: null,
    admin_notes: null,
  },
  {
    id: '4',
    created_at: '2025-01-05T16:45:00Z',
    updated_at: '2025-01-05T16:45:00Z',
    marque: 'Volkswagen',
    modele: 'Golf 8 GTI',
    annee_min: 2021,
    annee_max: 2023,
    kilometrage_max: 30000,
    prix_max: 38000,
    carburant: 'Essence',
    transmission: 'Manuelle',
    notes: 'Version performance uniquement',
    status: 'pending',
    report_url: null,
    admin_notes: null,
  },
];

const statusConfig = {
  pending: { 
    label: 'En attente', 
    icon: Clock, 
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  in_progress: { 
    label: 'En cours', 
    icon: AlertCircle, 
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  completed: { 
    label: 'Bonne affaire', 
    icon: CheckCircle, 
    badgeClass: 'bg-green-100 text-green-700 border-green-200' 
  },
};

const ClientDashboard = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('reports');
  
  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [notes, setNotes] = useState('');

  // Credits (mock)
  const userCredits = 3;

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
        // Use mock data for demo
        setReports(mockReports as Report[]);
      } else {
        setReports(data?.length ? data : mockReports as Report[]);
      }
      setIsLoading(false);
    };
    
    fetchReports();
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modelSearch.trim()) return;
    
    setIsSubmitting(true);
    
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
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      setReports(data || []);
    }
    
    setIsSubmitting(false);
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setModelSearch(searchQuery);
      setIsDialogOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-['Inter',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={logoTruffe}
                alt="Logo La Truffe" 
                className="h-9 w-9 rounded-lg object-cover"
              />
              <span className="text-lg font-bold text-gray-900">La Truffe</span>
            </div>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'reports', label: 'Rapports', icon: FileText },
                { id: 'settings', label: 'Paramètres', icon: Settings },
                { id: 'billing', label: 'Facturation', icon: Receipt },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeNav === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right: Credits + Profile */}
            <div className="flex items-center gap-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                {userCredits} crédits
              </Badge>
              <div className="relative">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Déconnexion"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Rapports</h1>
            <p className="text-gray-500 mt-1">Gérez vos analyses de véhicules</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Nouveau Rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                    className="text-base h-12"
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
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Rapport d'analyse</span>
                    <span className="text-xl font-bold text-primary">19€</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Rapport livré sous 24-48h
                  </p>
                </div>
                
                <Button type="submit" className="w-full gap-2 h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Commander (19€)
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* VIN/Search Hero Section */}
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Vérifier un nouveau véhicule
              </h2>
              <p className="text-gray-500 mb-6">
                Entrez le modèle du véhicule pour obtenir une analyse complète du marché
              </p>
              
              <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Entrer le modèle (ex: Golf 7, BMW X3...)"
                    className="pl-12 h-14 text-base border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 shadow-md">
                  Vérifier
                </Button>
              </form>
              
              <p className="text-sm text-gray-400 mt-4">
                Il vous reste <span className="font-semibold text-primary">{userCredits} crédits</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-6">
                <FolderOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Vous n'avez pas encore de rapports
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Vérifiez votre premier véhicule et obtenez une analyse complète du marché pour faire les meilleurs choix !
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Commander mon premier rapport
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Reports Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {reports.map((report) => {
              const StatusIcon = statusConfig[report.status].icon;
              const statusInfo = statusConfig[report.status];
              
              return (
                <Card 
                  key={report.id} 
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Left: Car Thumbnail */}
                      <div className="w-32 sm:w-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shrink-0">
                        <Car className="h-12 w-12 text-gray-300" />
                      </div>
                      
                      {/* Right: Content */}
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">
                              {report.marque} {report.modele}
                              {report.annee_min && ` (${report.annee_min})`}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono truncate">
                              ID: {report.id.substring(0, 8)}...
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`shrink-0 ${statusInfo.badgeClass}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Généré le {new Date(report.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {report.status === 'completed' ? (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/report/${report.id}`)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Voir le rapport
                          </Button>
                        ) : (
                          <p className="text-sm text-gray-400">
                            {report.status === 'pending' 
                              ? 'Traitement sous 24-48h'
                              : 'Analyse en cours...'
                            }
                          </p>
                        )}
                      </div>
                    </div>
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
