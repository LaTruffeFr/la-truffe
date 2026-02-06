import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BetaWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaWaitlistModal({ open, onOpenChange }: BetaWaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insérer dans la table beta_waitlist (à créer via migration)
      const { error } = await supabase.from('beta_waitlist').insert({
        email: email.trim().toLowerCase(),
      });

      if (error) {
        // Si l'email existe déjà
        if (error.code === '23505') {
          toast({
            title: "Déjà inscrit !",
            description: "Cette adresse est déjà sur la liste d'attente.",
          });
          setIsSuccess(true);
          return;
        }
        throw error;
      }

      setIsSuccess(true);
      toast({
        title: "Inscription réussie !",
        description: "Vous serez notifié dès que La Truffe sera disponible.",
      });
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vous inscrire. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setEmail('');
      setIsSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Rejoindre la Bêta
          </DialogTitle>
          <DialogDescription>
            La Truffe est en accès anticipé. Inscrivez-vous pour être parmi les premiers à en profiter.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Vous êtes sur la liste !</h3>
            <p className="text-slate-600 text-sm mb-6">
              Nous vous enverrons un email dès que vous pourrez accéder à La Truffe.
            </p>
            <Button onClick={handleClose} variant="outline">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Inscription...
                </>
              ) : (
                "S'inscrire à la liste d'attente"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              En vous inscrivant, vous acceptez de recevoir des emails de La Truffe.
              Pas de spam, promis.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
