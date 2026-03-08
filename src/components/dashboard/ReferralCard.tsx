import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Check, Share2 } from 'lucide-react';

const ReferralCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    if (!user) return '';
    return `https://latruffe-auto.fr/?ref=${user.id}`;
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Lien copié ! 🎉", description: "Partagez-le avec vos amis." });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`🐕 La Truffe - L'IA qui traque les arnaques auto !\nUtilise mon lien pour obtenir 1 audit gratuit :\n${referralLink}`)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Je viens de découvrir La Truffe 🐕 — l'IA qui analyse les annonces auto pour débusquer les arnaques.\n\nUtilise mon lien pour 1 audit gratuit 👇\n${referralLink}`)}`, '_blank');
  };

  if (!user) return null;

  return (
    <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl -ml-16 -mb-16" />
      
      <CardContent className="relative z-10 p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Parrainez un ami</h3>
            <p className="text-indigo-200 font-medium text-sm">Vous gagnez 1 Audit, il gagne 1 Audit ! 🎁</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Votre lien unique</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="bg-white/10 border-white/20 text-white font-mono text-xs h-12 rounded-xl backdrop-blur-sm focus-visible:ring-white/30 selection:bg-white/20"
            />
            <Button
              onClick={handleCopy}
              className={`h-12 px-5 rounded-xl font-bold shadow-lg transition-all ${
                copied 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Social Share */}
        <div className="flex gap-3">
          <Button
            onClick={shareWhatsApp}
            className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md"
          >
            <Share2 className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button
            onClick={shareTwitter}
            className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 backdrop-blur-sm"
          >
            <Share2 className="w-4 h-4 mr-2" /> Twitter
          </Button>
        </div>

        {/* Trust line */}
        <p className="text-center text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">
          Programme de parrainage La Truffe • Crédits illimités
        </p>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
