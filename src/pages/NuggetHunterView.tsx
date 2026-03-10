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
  { emoji: '🏅', label: 'Top 4', bg: 'bg-gradient-to-r from-primary/80 to-primary' },
  { emoji: '🏅', label: 'Top 5', bg: 'bg-gradient-to-r from-primary/60 to-primary/80' },
];

const loadingTexts = [
  'Connexion au radar Leboncoin...',
  'Analyse algorithmique du marché...',
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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <Header activeLink="selection" />

      {/* Background effects */}
      <div className="fixed top-40 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-1/4 w-72 h-72 bg-purple-400/8 blur-[80px] rounded-full pointer-events-none" />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-16 max-w-5xl relative z-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Target className="w-4 h-4" /> Gratuit • Aucun crédit consommé
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
            La Sélection
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            Laissez notre algorithme dénicher les meilleures affaires du marché pour vous.
          </p>
        </div>

        {/* Search Form */}
        <Card className="rounded-[2rem] border-border shadow-xl dark:shadow-none bg-card/80 backdrop-blur-sm overflow-hidden mb-12">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Marque *</Label>
                <Input
                  placeholder="ex: Peugeot"
                  value={marque}
                  onChange={e => setMarque(e.target.value)}
                  className="h-12 font-medium rounded-xl border-border bg-muted focus:bg-card transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Modèle *</Label>
                <Input
                  placeholder="ex: 308"
                  value={modele}
                  onChange={e => setModele(e.target.value)}
                  className="h-12 font-medium rounded-xl border-border bg-muted focus:bg-card transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Budget Max €</Label>
                <Input
                  type="number"
                  placeholder="optionnel"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="h-12 font-medium rounded-xl border-border bg-muted focus:bg-card transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Km Max</Label>
                <Input
                  type="number"
                  placeholder="optionnel"
                  value={kmMax}
                  onChange={e => setKmMax(e.target.value)}
                  className="h-12 font-medium rounded-xl border-border bg-muted focus:bg-card transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-13 px-10 rounded-xl font-bold shadow-lg shadow-primary/20 text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Radar className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Scan en cours...' : 'Lancer le Radar'}
              </Button>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Scan gratuit — l'expertise coûte 1 crédit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="relative mb-10">
              <div className="w-28 h-28 bg-card rounded-3xl flex items-center justify-center border border-border shadow-2xl shadow-primary/10">
                <ScanSearch className="w-14 h-14 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 border-2 border-primary/30 rounded-3xl animate-ping" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
              {loadingTexts[loadingStep]}
            </h3>
            <p className="text-muted-foreground font-medium max-w-md text-center mb-8">
              Notre moteur d'analyse scanne les annonces Leboncoin pour <span className="font-bold text-foreground">{marque} {modele}</span>.
            </p>
            <div className="w-72 bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
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
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                Top {nuggets.length} Pépites
              </h2>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-sm px-3 py-1">
                {marque} {modele}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nuggets.map((nugget, i) => {
                const badge = rankBadges[i] || rankBadges[4];
                return (
                  <Card
                    key={i}
                    className="rounded-2xl border-border shadow-md dark:shadow-none bg-card hover:shadow-2xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative h-48 bg-muted overflow-hidden">
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
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 ${badge.bg} text-white font-black px-3 py-1.5 rounded-xl text-sm shadow-lg flex items-center gap-1.5`}>
                        <span className="text-lg">{badge.emoji}</span> {badge.label}
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-black text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {nugget.title}
                      </h3>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                          <Euro className="w-4 h-4 text-primary" />
                          <span className="font-black text-primary text-lg">{nugget.price.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Gauge className="w-4 h-4" />
                          <span className="font-bold text-sm">{nugget.km.toLocaleString('fr-FR')} km</span>
                        </div>
                      </div>

                      <p className="text-xs text-primary/80 font-bold flex items-start gap-1.5 min-h-[2rem]">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {nugget.expert_reason}
                      </p>

                      <div className="space-y-2 pt-2">
                        <Button
                          onClick={() => navigate(`/audit?url=${encodeURIComponent(nugget.link)}`)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 shadow-lg shadow-primary/20"
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          Expertise complète (1 Crédit)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-primary font-medium text-xs"
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
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-black text-foreground mb-2">Aucune pépite trouvée</h3>
            <p className="text-muted-foreground font-medium">Essayez avec d'autres critères de recherche.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}