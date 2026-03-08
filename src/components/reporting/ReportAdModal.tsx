import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adUrl: string;
}

const REASONS = [
  'Arnaque suspectée / Faux vendeur',
  'Véhicule déjà vendu',
  'Fausse information / Compteur trafiqué',
  'Autre',
];

const ReportAdModal = ({ open, onOpenChange, adUrl }: ReportAdModalProps) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Veuillez sélectionner un motif.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('reported_listings' as any).insert({
        user_id: user.id,
        ad_url: adUrl,
        reason,
        details: details.trim() || null,
      } as any);

      if (error) throw error;

      toast.success('Merci, notre équipe va vérifier cette annonce.');
      setReason('');
      setDetails('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
            <Flag className="w-5 h-5 text-rose-500" />
            Signaler cette annonce
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Aidez-nous à maintenir La Truffe sûre en signalant les annonces frauduleuses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-3">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="text-sm text-slate-700 cursor-pointer">{r}</Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Détails supplémentaires (facultatif)..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="resize-none rounded-xl"
            rows={3}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !reason}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
              Envoyer le signalement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportAdModal;
