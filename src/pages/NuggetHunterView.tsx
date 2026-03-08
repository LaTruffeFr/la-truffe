import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Footer } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Radar, ScanSearch, Loader2, Trophy, Euro, Gauge,
  ExternalLink, FileCheck, Sparkles, Target, Search
} from 'lucide-react';

interface Nugget {
  rank: number;
  title: string;
  price: number;
  km: number;
  link: string;
  image_url?: string;
  expert_reason: string;
}

const rankBadges = [
  { emoji: '🥇', label: 'Top 1', bg: 'bg-gradient-to-r from-amber-400 to-yellow-500' },
  { emoji: '🥈', label: 'Top 2', bg: 'bg-gradient-to-r from-slate-300 to-slate-400' },
  { emoji: '🥉', label: 'Top 3', bg: 'bg-gradient-to-r from-amber-600 to-orange-600' },
  { emoji: '🏅', label: 'Top 4', bg: 'bg-gradient-to-r from-indigo-400 to-indigo-500' },
  { emoji: '🏅', label: 'Top 5', bg: 'bg-gradient-to-r from-indigo-300 to-indigo-400' },
];

const loadingTexts = [
  'Connexion au radar Leboncoin...',
  'Gemini analyse le marché...',
  'Extraction des photos...',
  'Identification des meilleures affaires...',
  'Classement du Top 5...',
];

export default function NuggetHunterView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [budget, setBudget] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!user) {
      navigate('/auth?redirect=/chasseur&message=Connectez-vous pour utiliser le Chasseur de Pépites');
      return;
    }

    if (!marque.trim() || !modele.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Remplissez au moins la marque et le modèle.' });
      return;
    }

    const budgetNum = budget.trim() ? parseInt(budget) : undefined;
    const kmMaxNum = kmMax.trim() ? parseInt(kmMax) : undefined;

    setIsLoading(true);
    setNuggets([]);
    setLoadingStep(0);
    setHasSearched(true);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 3500);

    try {
      const { data, error } = await supabase.functions.invoke('hunt-nuggets', {
        body: { marque: marque.trim(), modele: modele.trim(), budget: budgetNum, km_max: kmMaxNum },
      });

      clearInterval(interval);

      if (error) throw new Error(error.message || 'Erreur réseau');

      if (data?.error) {
        toast({ variant: 'destructive', title: 'Aucun résultat', description: data.error });
        return;
      }

      if (data?.top5) {
        setNuggets(data.top5);
        toast({ title: `${data.top5.length} pépites trouvées ! 🏆` });
      }
    } catch (err: any) {
      console.error('Hunt error:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: err.message || 'Impossible de scanner le marché.' });
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <Header activeLink="hunting" />

      {/* Background effects */}
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-1/4 w-72 h-72 bg-purple-400/8 blur-[80px] rounded-full pointer-events-none" />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-16 max-w-5xl relative z-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-indigo-100">
            <Target className="w-4 h-4" /> Gratuit • Aucun crédit consommé
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">
            Le Chasseur de Pépites
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Laissez l'IA traquer les meilleures affaires du marché Leboncoin pour vous.
          </p>
        </div>

        {/* Search Form */}
        <Card className="rounded-[2rem] border-slate-100 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden mb-12">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Marque *</Label>
                <Input
                  placeholder="ex: Peugeot"
                  value={marque}
                  onChange={e => setMarque(e.target.value)}
                  className="h-12 font-medium rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Modèle *</Label>
                <Input
                  placeholder="ex: 308"
                  value={modele}
                  onChange={e => setModele(e.target.value)}
                  className="h-12 font-medium rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Budget Max €</Label>
                <Input
                  type="number"
                  placeholder="optionnel"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="h-12 font-medium rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Km Max</Label>
                <Input
                  type="number"
                  placeholder="optionnel"
                  value={kmMax}
                  onChange={e => setKmMax(e.target.value)}
                  className="h-12 font-medium rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white h-13 px-10 rounded-xl font-bold shadow-lg shadow-indigo-200 text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Radar className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Scan en cours...' : 'Lancer le Radar'}
              </Button>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Scan gratuit — l'expertise coûte 1 crédit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="relative mb-10">
              <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-2xl shadow-indigo-500/10">
                <ScanSearch className="w-14 h-14 text-indigo-600 animate-pulse" />
              </div>
              <div className="absolute inset-0 border-2 border-indigo-400/30 rounded-3xl animate-ping" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              {loadingTexts[loadingStep]}
            </h3>
            <p className="text-slate-500 font-medium max-w-md text-center mb-8">
              L'IA analyse les annonces Leboncoin pour <span className="font-bold text-slate-700">{marque} {modele}</span>.
            </p>
            <div className="w-72 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(loadingStep + 1) * 20}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && nuggets.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 text-amber-500" />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Top {nuggets.length} Pépites
              </h2>
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-bold text-sm px-3 py-1">
                {marque} {modele}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nuggets.map((nugget, i) => {
                const badge = rankBadges[i] || rankBadges[4];
                return (
                  <Card
                    key={i}
                    className="rounded-2xl border-slate-100 shadow-md bg-white hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      {nugget.image_url ? (
                        <img
                          src={nugget.image_url}
                          alt={nugget.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                          <Search className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      {/* Rank Badge */}
                      <div className={`absolute top-3 left-3 ${badge.bg} text-white font-black px-3 py-1.5 rounded-xl text-sm shadow-lg flex items-center gap-1.5`}>
                        <span className="text-lg">{badge.emoji}</span> {badge.label}
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-4">
                      {/* Title */}
                      <h3 className="font-black text-base text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors min-h-[2.5rem]">
                        {nugget.title}
                      </h3>

                      {/* Price & KM */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg">
                          <Euro className="w-4 h-4 text-indigo-600" />
                          <span className="font-black text-indigo-600 text-lg">{nugget.price.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Gauge className="w-4 h-4" />
                          <span className="font-bold text-sm">{nugget.km.toLocaleString('fr-FR')} km</span>
                        </div>
                      </div>

                      {/* Expert reason */}
                      <p className="text-xs text-indigo-600/80 font-bold flex items-start gap-1.5 min-h-[2rem]">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {nugget.expert_reason}
                      </p>

                      {/* Actions */}
                      <div className="space-y-2 pt-2">
                        <Button
                          onClick={() => navigate(`/audit?url=${encodeURIComponent(nugget.link)}`)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 shadow-lg shadow-indigo-200"
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          Expertise complète (1 Crédit)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-slate-400 hover:text-indigo-600 font-medium text-xs"
                          onClick={() => window.open(nugget.link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1.5" /> Voir l'annonce sur Leboncoin
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state after search */}
        {!isLoading && hasSearched && nuggets.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Aucune pépite trouvée</h3>
            <p className="text-slate-500 font-medium">Essayez avec d'autres critères de recherche.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
