import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Plus, Trash2, CheckCircle2, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PublishReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: any[];
  trendLine: any;
  kpis: any;
  vehicleInfo: any;
  clients?: any[]; // Nouvelle prop pour la liste des clients
}

export function PublishReportModal({ isOpen, onClose, vehicles, trendLine, kpis, vehicleInfo, clients = [] }: PublishReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [reportId, setReportId] = useState<string | null>(null);

  // Données du rapport
  const [expertOpinion, setExpertOpinion] = useState("");
  const [points, setPoints] = useState([{ titre: "", desc: "" }]);
  
  // Données du client
  const [selectedClientId, setSelectedClientId] = useState<string>("new");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Remplissage auto quand on choisit un client existant
  const handleClientSelect = (value: string) => {
    setSelectedClientId(value);
    if (value !== "new") {
      const client = clients.find(c => c.id === value);
      if (client) {
        setClientName(`${client.first_name || ''} ${client.last_name || ''}`.trim());
        setClientEmail(client.email || "");
      }
    } else {
      setClientName("");
      setClientEmail("");
    }
  };

  useEffect(() => {
    if (isOpen && vehicles.length > 0) {
      const bestDeal = vehicles.sort((a, b) => b.dealScore - a.dealScore)[0];
      const prixMarche = kpis.avgPrice;
      const ecart = prixMarche - (bestDeal?.prix || 0);
      const percent = Math.round((ecart / prixMarche) * 100);

      let avis = `Analyse du marché ${vehicleInfo?.marque} ${vehicleInfo?.modele} : ${vehicles.length} véhicules analysés. `;
      if (ecart > 0) {
        avis += `Le marché offre de belles opportunités. Le véhicule en tête de liste se démarque avec une économie potentielle de ${percent}% (${ecart.toLocaleString()}€).`;
      } else {
        avis += `Le marché est tendu. La négociation sera difficile mais possible sur les véhicules avec défauts.`;
      }
      setExpertOpinion(avis);

      const defaultPoints = [];
      if (kpis.avgKm > 100000) defaultPoints.push({ titre: "Kilométrage", desc: "Moyenne > 100 000km. Vérifier distribution." });
      else defaultPoints.push({ titre: "Historique", desc: "Exigez le carnet d'entretien." });
      
      if (ecart > 0) defaultPoints.push({ titre: "Prix Bas", desc: "Vérifiez l'absence de frais cachés." });
      else defaultPoints.push({ titre: "Concurrence", desc: "Faites jouer les offres similaires." });

      setPoints(defaultPoints);
    }
  }, [isOpen, vehicles, kpis, vehicleInfo]);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Non connecté");

      const cleanPoints = points.filter(p => p.titre.trim() !== "");
      // On encode les arguments dans l'avis expert pour contourner le schéma
      const contentToSave = expertOpinion + "|||DATA|||" + JSON.stringify(cleanPoints);

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          marque: vehicleInfo?.marque || "Inconnu",
          modele: vehicleInfo?.modele || "Inconnu",
          status: 'completed',
          expert_opinion: contentToSave,
          // On sauvegarde aussi les infos client dans le JSON market_data (astuce pour ne pas toucher au schéma)
          market_data: [
            { 
               client_info: { 
                 id: selectedClientId === "new" ? null : selectedClientId,
                 name: clientName,
                 email: clientEmail
               } 
            },
            ...vehicles.slice(0, 50).map(v => ({
             prix: v.prix,
             kilometrage: v.kilometrage,
             annee: v.annee,
             titre: v.titre,
             image: v.image,
             lien: v.lien,
             dealScore: v.dealScore
          }))],
          prix_moyen: kpis.avgPrice,
          total_vehicules: vehicles.length,
          opportunites_count: kpis.opportunitiesCount,
          vehicles_data: vehicles.slice(0, 10)
        })
        .select()
        .single();

      if (error) throw error;

      setReportId(data.id);
      setStep(2);
      toast({ title: "Rapport publié !", description: "Lien prêt." });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Finaliser et Attribuer le Rapport</DialogTitle>
              <DialogDescription>Choisissez le client et validez l'analyse.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              
              {/* SÉLECTION CLIENT */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="font-bold mb-3 block flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Destinataire du rapport
                </Label>
                
                <div className="grid gap-4">
                  {clients.length > 0 && (
                    <Select onValueChange={handleClientSelect} value={selectedClientId}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choisir un client existant..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ Nouveau Client / Invité</SelectItem>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Nom du client</Label>
                      <Input 
                        placeholder="Jean Dupont" 
                        value={clientName} 
                        onChange={(e) => setClientName(e.target.value)} 
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Email (Optionnel)</Label>
                      <Input 
                        placeholder="jean@email.com" 
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ÉDITION TEXTE */}
              <div className="space-y-2">
                <Label className="font-bold">📝 Avis de l'expert</Label>
                <Textarea value={expertOpinion} onChange={(e) => setExpertOpinion(e.target.value)} className="min-h-[100px]" />
              </div>

              {/* ÉDITION ARGUMENTS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">💡 Arguments</Label>
                  <Button variant="outline" size="sm" onClick={() => setPoints([...points, { titre: "", desc: "" }])}>
                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                  </Button>
                </div>
                {points.map((point, index) => (
                  <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Titre" value={point.titre} onChange={(e) => {
                          const newPoints = [...points]; newPoints[index].titre = e.target.value; setPoints(newPoints);
                        }} className="font-bold bg-white" />
                      <Textarea placeholder="Détail" value={point.desc} onChange={(e) => {
                          const newPoints = [...points]; newPoints[index].desc = e.target.value; setPoints(newPoints);
                        }} className="min-h-[60px] bg-white text-sm" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPoints(points.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handlePublish} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Publier
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Rapport Prêt !</DialogTitle>
            </DialogHeader>
            <div className="py-8 space-y-4 text-center">
              <p>Le rapport pour <strong>{clientName}</strong> a été généré.</p>
              <Input value={`${window.location.origin}/report/${reportId}`} readOnly />
              <div className="flex gap-2 justify-center">
                 <Button onClick={() => window.open(`/report/${reportId}`, '_blank')} className="bg-slate-900">Voir le rapport</Button>
                 {clientEmail && <Button variant="outline" onClick={() => toast({title: "Email envoyé", description: `À ${clientEmail}`})}>Renvoyer l'email</Button>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}