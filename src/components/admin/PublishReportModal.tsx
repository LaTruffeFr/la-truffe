import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, CheckCircle, User, Mail, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VehicleWithScore } from '@/lib/csvParser';

interface ReportOrder {
  id: string;
  user_id: string;
  marque: string;
  modele: string;
  status: string;
  user_email?: string;
}

interface PublishReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleWithScore[];
  trendLine: { slope: number; intercept: number };
  kpis: {
    avgPrice: number;
    decotePer10k: number;
    bestOffer: VehicleWithScore | null;
    opportunitiesCount: number;
  };
  vehicleInfo: { marque: string; modele: string } | null;
}

const DEFAULT_EXPERT_OPINION = `Analyse de ce modèle : les véhicules analysés montrent une bonne diversité en termes de kilométrage et d'équipements. 

Le marché actuel offre plusieurs opportunités intéressantes, notamment sur les véhicules avec un kilométrage raisonnable et un entretien complet.

Points de vigilance : vérifiez systématiquement l'historique d'entretien et l'absence de sinistre déclaré.`;

const DEFAULT_NEGOTIATION_ARGUMENTS = `1. **Entretien :** Vérifiez si les révisions majeures ont été faites. Sinon, demandez une réduction de 500-800€.

2. **Pneumatiques :** Si les pneus sont usés à plus de 50%, négociez 300-500€ pour leur remplacement.

3. **Contrôle technique :** Demandez le dernier CT. Tout défaut mentionné est un levier de négociation.

4. **Garantie :** Si aucune garantie n'est offerte, négociez une extension ou une remise de 5-10%.`;

export function PublishReportModal({
  isOpen,
  onClose,
  vehicles,
  trendLine,
  kpis,
  vehicleInfo,
}: PublishReportModalProps) {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [expertOpinion, setExpertOpinion] = useState<string>(DEFAULT_EXPERT_OPINION);
  const [negotiationArguments, setNegotiationArguments] = useState<string>(DEFAULT_NEGOTIATION_ARGUMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Fetch pending orders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      setIsSuccess(false);
      setSelectedOrderId('');
      setCustomEmail('');
      setExpertOpinion(DEFAULT_EXPERT_OPINION);
      setNegotiationArguments(DEFAULT_NEGOTIATION_ARGUMENTS);
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    setIsFetching(true);
    try {
      // Fetch pending/in_progress reports
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, user_id, marque, modele, status')
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(reports || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commandes',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedOrderId && !customEmail) {
      toast({
        title: 'Sélection requise',
        description: 'Veuillez sélectionner une commande ou entrer un email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare ALL vehicles data for the chart
      const allVehiclesData = vehicles.map(v => {
        const expectedPrice = trendLine.slope * v.kilometrage + trendLine.intercept;
        return {
          id: v.id,
          titre: v.titre,
          marque: v.marque,
          modele: v.modele,
          prix: v.prix,
          kilometrage: v.kilometrage,
          annee: v.annee,
          carburant: v.carburant,
          transmission: v.transmission,
          puissance: v.puissance,
          localisation: v.localisation,
          image: v.image,
          lien: v.lien,
          // Cluster data
          clusterId: v.clusterId,
          clusterSize: v.clusterSize,
          coteCluster: v.coteCluster,
          ecartEuros: v.ecartEuros,
          ecartPourcent: v.ecartPourcent,
          dealScore: v.dealScore,
          isPremium: v.isPremium,
          hasEnoughData: v.hasEnoughData,
          // Legacy fields
          prixMoyen: v.prixMoyen,
          prixMedian: v.prixMedian,
          ecart: v.ecart,
          segmentKey: v.segmentKey,
          // Calculated fields
          prix_median_segment: Math.round(expectedPrice),
          gain_potentiel: Math.round(expectedPrice - v.prix),
          score_confiance: Math.abs(v.dealScore),
        };
      });

      // Filter opportunities (deals below trendline = ecartEuros > 0 or dealScore < 0)
      const opportunities = allVehiclesData.filter(v => v.ecartEuros > 0 || v.dealScore < 0);

      // Calculate prix_truffe (average of top opportunities)
      const avgTruffePrice = opportunities.length > 0
        ? Math.round(opportunities.slice(0, 10).reduce((sum, v) => sum + v.prix, 0) / Math.min(opportunities.length, 10))
        : kpis.avgPrice;

      const avgSavings = opportunities.length > 0
        ? Math.round(opportunities.slice(0, 10).reduce((sum, v) => sum + (v.gain_potentiel || 0), 0) / Math.min(opportunities.length, 10))
        : 0;

      if (selectedOrderId) {
        // Update existing order with ALL vehicles data (for the chart)
        const { error } = await supabase
          .from('reports')
          .update({
            status: 'completed',
            prix_moyen: kpis.avgPrice,
            prix_truffe: avgTruffePrice,
            economie_moyenne: avgSavings,
            decote_par_10k: kpis.decotePer10k,
            total_vehicules: vehicles.length,
            opportunites_count: kpis.opportunitiesCount,
            vehicles_data: allVehiclesData,
            expert_opinion: expertOpinion,
            negotiation_arguments: negotiationArguments,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedOrderId);

        if (error) throw error;
      } else if (customEmail) {
        toast({
          title: 'Email non supporté',
          description: 'Veuillez sélectionner une commande existante pour le moment',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Rapport publié !',
        description: 'Le client peut maintenant voir son rapport',
      });

      // Close after a short delay
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error publishing report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier le rapport',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Envoyer ce rapport à...
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un client en attente et personnalisez le rapport
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-lg">Rapport publié avec succès !</p>
            <p className="text-sm text-muted-foreground">
              Le client peut maintenant voir les résultats
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Summary of what will be sent */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Données à publier :</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Modèle :</span>{' '}
                  <span className="font-medium">{vehicleInfo?.marque} {vehicleInfo?.modele}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prix moyen :</span>{' '}
                  <span className="font-medium">{kpis.avgPrice.toLocaleString('fr-FR')} €</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Opportunités :</span>{' '}
                  <span className="font-medium text-green-600">{kpis.opportunitiesCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Véhicules :</span>{' '}
                  <span className="font-medium">{vehicles.length}</span>
                </div>
              </div>
            </div>

            {/* Select existing order */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Commande client en attente
              </Label>
              {isFetching ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              ) : (
                <Select value={selectedOrderId} onValueChange={(value) => {
                  setSelectedOrderId(value);
                  setCustomEmail('');
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Sélectionner une commande..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {orders.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Aucune commande en attente
                      </div>
                    ) : (
                      orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex flex-col">
                            <span>{order.marque} {order.modele}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.status === 'pending' ? 'En attente' : 'En cours'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Expert Opinion */}
            <div className="space-y-2">
              <Label htmlFor="expertOpinion" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Avis de l'expert
              </Label>
              <Textarea
                id="expertOpinion"
                placeholder="Rédigez l'avis de l'expert sur ce véhicule..."
                value={expertOpinion}
                onChange={(e) => setExpertOpinion(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Cet avis sera affiché dans la section "Avis de l'expert" du rapport client.
              </p>
            </div>

            {/* Negotiation Arguments */}
            <div className="space-y-2">
              <Label htmlFor="negotiationArguments" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Arguments de négociation
              </Label>
              <Textarea
                id="negotiationArguments"
                placeholder="1. Argument 1...&#10;2. Argument 2...&#10;3. Argument 3..."
                value={negotiationArguments}
                onChange={(e) => setNegotiationArguments(e.target.value)}
                rows={6}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez le format Markdown. Chaque argument sera affiché dans une liste numérotée.
              </p>
            </div>

            {/* OR divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou envoi manuel</span>
              </div>
            </div>

            {/* Custom email input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email du client (bientôt disponible)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setSelectedOrderId('');
                }}
                disabled={!!selectedOrderId}
              />
              <p className="text-xs text-muted-foreground">
                Fonctionnalité à venir - utilisez une commande existante
              </p>
            </div>

            {/* Action button */}
            <Button 
              onClick={handlePublish} 
              className="w-full gap-2"
              disabled={isLoading || (!selectedOrderId && !customEmail)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publication en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer & Enregistrer
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
