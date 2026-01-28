import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, CheckCircle, User, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";
import { VehicleWithScore } from '@/lib/csvParser';

// On ajoute 'clients' ici pour corriger l'erreur TypeScript
interface PublishReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleWithScore[];
  trendLine: any;
  kpis: any;
  vehicleInfo: any;
  clients?: any[]; // <--- La correction est ici
}

export function PublishReportModal({
  isOpen,
  onClose,
  vehicles,
  trendLine,
  kpis,
  vehicleInfo,
  clients = []
}: PublishReportModalProps) {
  const [step, setStep] = useState(1);
  const [reportId, setReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // États pour l'édition manuelle
  const [expertOpinion, setExpertOpinion] = useState('');
  const [points, setPoints] = useState([{ titre: "", desc: "" }, { titre: "", desc: "" }, { titre: "", desc: "" }]);
  
  const [selectedClientId, setSelectedClientId] = useState<string>("new");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [clientsList, setClientsList] = useState<any[]>(clients);

  // Chargement de secours des clients si la prop est vide
  useEffect(() => {
    const loadClients = async () => {
      if (clients.length === 0) {
        const { data } = await supabase.from('reports').select('id, marque, modele, status').eq('status', 'pending');
        if (data) setClientsList(data);
      } else {
        setClientsList(clients);
      }
    };
    if (isOpen) loadClients();
  }, [isOpen, clients]);

  // Pré-remplissage intelligent à l'ouverture
  useEffect(() => {
    if (isOpen && vehicles.length > 0) {
      setStep(1);
      const bestDeal = vehicles[0];
      const prixMarche = kpis.avgPrice;
      const ecart = prixMarche - (bestDeal?.prix || 0);
      const percent = Math.round((ecart / prixMarche) * 100);

      setExpertOpinion(
        `Le marché pour la ${vehicleInfo?.marque} ${vehicleInfo?.modele} est dynamique avec ${vehicles.length} annonces analysées. ` +
        `Le prix moyen se situe autour de ${prixMarche.toLocaleString()}€. ` +
        (ecart > 0 ? `Nous avons identifié une excellente opportunité à -${percent}% sous le marché.` : `Les prix sont actuellement soutenus.`)
      );
    }
  }, [isOpen, vehicles, kpis, vehicleInfo]);

  const handleClientSelect = (value: string) => {
    setSelectedClientId(value);
    // Si on avait les infos détaillées du client, on pourrait pré-remplir ici
    // Pour l'instant on laisse les champs vides pour le "Nouveau Client"
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      // 1. Récupération de l'utilisateur (Optionnel pour ne pas bloquer Lovable Cloud)
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      const cleanPoints = points.filter(p => p.titre.trim() !== "");
      
      // 2. Encodage des arguments dans l'avis expert (Hack de compatibilité)
      const expertOpinionCombined = expertOpinion + "|||DATA|||" + JSON.stringify(cleanPoints);

      // 3. Préparation de toutes les données véhicules
      const allVehiclesData = vehicles.map(v => ({
          ...v,
          prix_median_segment: Math.round(trendLine.slope * v.kilometrage + trendLine.intercept),
          gain_potentiel: Math.round((trendLine.slope * v.kilometrage + trendLine.intercept) - v.prix),
          score_confiance: Math.abs(v.dealScore),
      }));

      // 4. Construction de l'objet à sauvegarder
      const reportPayload: any = {
        marque: vehicleInfo?.marque || "Inconnu",
        modele: vehicleInfo?.modele || "Inconnu",
        status: 'completed',
        expert_opinion: expertOpinionCombined,
        market_data: [
            { client_info: { id: selectedClientId === "new" ? null : selectedClientId, name: clientName, email: clientEmail } }
        ],
        prix_moyen: kpis.avgPrice,
        total_vehicules: vehicles.length,
        opportunites_count: kpis.opportunitiesCount,
        vehicles_data: allVehiclesData
      };

      // Ajout de l'user_id seulement si connecté
      if (user) reportPayload.user_id = user.id;

      // 5. Envoi à Supabase
      let result;
      
      if (selectedClientId !== "new") {
        // Mise à jour d'une commande existante
        result = await supabase
          .from('reports')
          .update(reportPayload)
          .eq('id', selectedClientId)
          .select()
          .single();
      } else {
        // Création d'un nouveau rapport
        result = await supabase
          .from('reports')
          .insert(reportPayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setReportId(result.data.id);
      setStep(2);
      toast({ title: "Succès", description: "Rapport publié !" });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader><DialogTitle>Finaliser le Rapport</DialogTitle><DialogDescription>Validez le client et l'analyse.</DialogDescription></DialogHeader>
            <div className="space-y-6 py-4">
              
              <div className="bg-slate-50 p-4 rounded-lg border">
                <Label className="font-bold mb-2 block">Destinataire</Label>
                <Select onValueChange={handleClientSelect} value={selectedClientId}>
                  <SelectTrigger className="bg-white mb-2"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Nouveau Rapport (Sans commande)</SelectItem>
                    {clientsList.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.marque} {c.modele} (En attente)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedClientId === "new" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Input placeholder="Nom du client (Optionnel)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-white" />
                    <Input placeholder="Email (Optionnel)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-white" />
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="font-bold block mb-2">Avis de l'Expert</Label>
                <Textarea value={expertOpinion} onChange={(e) => setExpertOpinion(e.target.value)} className="h-32" placeholder="Votre analyse du marché..." />
              </div>

              <div>
                <Label className="font-bold block mb-2">Arguments de Négociation</Label>
                <div className="space-y-3">
                  {points.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Titre (ex: Distribution)" value={p.titre} onChange={(e) => { const n = [...points]; n[i].titre = e.target.value; setPoints(n); }} className="w-1/3 font-bold" />
                      <Input placeholder="Description" value={p.desc} onChange={(e) => { const n = [...points]; n[i].desc = e.target.value; setPoints(n); }} className="flex-1" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handlePublish} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {isLoading ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publier
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader><DialogTitle className="text-center text-green-600 flex flex-col items-center gap-2"><CheckCircle className="h-12 w-12" /> Rapport Prêt !</DialogTitle></DialogHeader>
            <div className="py-6 text-center space-y-4">
              <p className="text-muted-foreground">Le rapport a été généré et lié au client.</p>
              <Input value={`${window.location.origin}/report/${reportId}`} readOnly />
              <Button onClick={() => window.open(`/report/${reportId}`, '_blank')} className="bg-slate-900 w-full">Voir le rapport</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}