import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, CheckCircle, AlertCircle, Upload, ExternalLink, FileText, Send, Link, Copy, FileUp } from 'lucide-react';
import { parseCSVFile, type VehicleWithScore } from '@/lib/csvParser';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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
  share_token: string | null;
  lien_annonce: string | null;
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  in_progress: { label: 'En cours', icon: AlertCircle, color: 'bg-blue-500' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'bg-green-500' },
};

export function ClientOrdersPanel() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for updating report
  const [reportUrl, setReportUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedReportForEmail, setSelectedReportForEmail] = useState<Report | null>(null);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [selectedReportForCsv, setSelectedReportForCsv] = useState<Report | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

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
        description: 'Impossible de charger les commandes',
        variant: 'destructive',
      });
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openEditDialog = (report: Report) => {
    setSelectedReport(report);
    setReportUrl(report.report_url || '');
    setAdminNotes(report.admin_notes || '');
    setStatus(report.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('reports')
      .update({
        report_url: reportUrl || null,
        admin_notes: adminNotes || null,
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedReport.id);
    
    if (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la commande',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Commande mise à jour',
      });
      setIsDialogOpen(false);
      fetchReports();
    }
    
    setIsSubmitting(false);
  };

  const getPublicAuditUrl = (shareToken: string | null) => {
    if (!shareToken) return null;
    return `${window.location.origin}/audit/${shareToken}`;
  };

  const copyLinkToClipboard = async (shareToken: string | null) => {
    if (!shareToken) {
      toast({
        title: 'Lien non disponible',
        description: 'Envoyez d\'abord le rapport au client pour générer un lien sécurisé',
        variant: 'destructive',
      });
      return;
    }
    const url = getPublicAuditUrl(shareToken);
    if (url) {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Lien copié !',
        description: 'Le lien de l\'audit a été copié dans le presse-papier',
      });
    }
  };

  const openEmailDialog = (report: Report) => {
    setSelectedReportForEmail(report);
    setClientEmail('');
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedReportForEmail || !clientEmail) return;
    
    setIsSendingEmail(selectedReportForEmail.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: { 
          reportId: selectedReportForEmail.id, 
          clientEmail 
        }
      });
      
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Erreur lors de l\'envoi');
      }
      
      toast({
        title: 'Email envoyé !',
        description: `L'audit a été envoyé à ${clientEmail}`,
      });
      setIsEmailDialogOpen(false);
    } catch (err: unknown) {
      console.error('Email send error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'envoyer l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const openCsvDialog = (report: Report) => {
    setSelectedReportForCsv(report);
    setCsvFile(null);
    setIsCsvDialogOpen(true);
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedReportForCsv) return;
    setIsUploadingCsv(true);

    try {
      const vehicles = await parseCSVFile(csvFile);
      if (!vehicles || vehicles.length === 0) {
        toast({ title: 'Erreur', description: 'Aucun véhicule trouvé dans le CSV', variant: 'destructive' });
        return;
      }

      // Use the first vehicle's data to fill the report
      const first = vehicles[0];
      const avgPrice = vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + v.prix, 0) / vehicles.length) : 0;

      const { error } = await supabase
        .from('reports')
        .update({
          marque: first.marque || 'Inconnu',
          modele: first.modele || 'Inconnu',
          annee: first.annee || null,
          kilometrage: first.kilometrage || null,
          prix_affiche: first.prix || null,
          prix_moyen: avgPrice || null,
          total_vehicules: vehicles.length,
          vehicles_data: vehicles as any,
          status: 'completed' as const,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReportForCsv.id);

      if (error) throw error;

      toast({ title: 'Succès ✅', description: `Rapport mis à jour avec ${vehicles.length} véhicules.` });
      setIsCsvDialogOpen(false);
      fetchReports();
    } catch (err: any) {
      console.error('CSV upload error:', err);
      toast({ title: 'Erreur', description: err.message || 'Erreur lors du traitement du CSV', variant: 'destructive' });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commandes Clients</h2>
          <p className="text-muted-foreground">Gérez les demandes de rapport</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {reports.length} commande{reports.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground">
              Les demandes de rapport des clients apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const StatusIcon = statusConfig[report.status].icon;
            return (
              <Card key={report.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {report.marque} {report.modele}
                        {report.status === 'pending' && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Demande du {new Date(report.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig[report.status].color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[report.status].label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Lien annonce client */}
                  {report.lien_annonce && (
                    <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Lien de l'annonce :</span>
                      <a 
                        href={report.lien_annonce} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {report.lien_annonce}
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
                    <p className="text-sm text-muted-foreground mb-4 italic border-l-2 border-primary/30 pl-3">
                      "{report.notes}"
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bouton CSV Upload pour les rapports pending */}
                    {report.status === 'pending' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => openCsvDialog(report)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Uploader CSV
                      </Button>
                    )}
                    <Dialog open={isDialogOpen && selectedReport?.id === report.id} onOpenChange={(open) => {
                      if (!open) setIsDialogOpen(false);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(report)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {report.report_url ? 'Modifier' : 'Uploader PDF'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gérer la commande</DialogTitle>
                          <DialogDescription>
                            {report.marque} {report.modele}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="completed">Terminé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>URL du rapport PDF</Label>
                            <Input
                              value={reportUrl}
                              onChange={(e) => setReportUrl(e.target.value)}
                              placeholder="https://..."
                              type="url"
                            />
                            <p className="text-xs text-muted-foreground">
                              Collez le lien vers le PDF (Google Drive, Dropbox, etc.)
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Notes pour le client</Label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Message visible par le client..."
                              rows={3}
                            />
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Mise à jour...
                              </>
                            ) : (
                              'Enregistrer'
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Actions pour les rapports terminés */}
                    {report.status === 'completed' && (
                      <>
                        {report.share_token ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyLinkToClipboard(report.share_token)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copier le lien
                          </Button>
                        ) : null}
                        <Button 
                          size="sm"
                          onClick={() => openEmailDialog(report)}
                          disabled={isSendingEmail === report.id}
                        >
                          {isSendingEmail === report.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {report.share_token ? 'Renvoyer au client' : 'Envoyer au client'}
                        </Button>
                        {report.share_token && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(getPublicAuditUrl(report.share_token), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voir l'audit
                          </Button>
                        )}
                      </>
                    )}
                    
                    {report.report_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(report.report_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Dialog pour envoyer email */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer l'audit au client</DialogTitle>
            <DialogDescription>
              {selectedReportForEmail && `${selectedReportForEmail.marque} ${selectedReportForEmail.modele}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email du client</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@exemple.com"
              />
            </div>
            
            {selectedReportForEmail?.share_token && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Lien de l'audit</Label>
                <p className="text-sm font-mono truncate">
                  {getPublicAuditUrl(selectedReportForEmail.share_token)}
                </p>
              </div>
            )}
            {!selectedReportForEmail?.share_token && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600">
                  Un lien sécurisé sera généré automatiquement lors de l'envoi de l'email.
                </p>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleSendEmail}
              disabled={!clientEmail || isSendingEmail !== null}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour upload CSV */}
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader le CSV du scraping</DialogTitle>
            <DialogDescription>
              {selectedReportForCsv && `Rapport: ${selectedReportForCsv.marque} ${selectedReportForCsv.modele}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedReportForCsv?.lien_annonce && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Lien de l'annonce client</Label>
                <a href={selectedReportForCsv.lien_annonce} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> {selectedReportForCsv.lien_annonce}
                </a>
              </div>
            )}

            <div className="space-y-2">
              <Label>Fichier CSV (WebScraper.io, etc.)</Label>
              <Input
                type="file"
                accept=".csv,.txt,.json"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCsvUpload}
              disabled={!csvFile || isUploadingCsv}
            >
              {isUploadingCsv ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Traiter et publier le rapport
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
