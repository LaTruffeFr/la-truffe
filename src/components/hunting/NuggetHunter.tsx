import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Radar, ScanSearch, Loader2, Trophy, Euro, Gauge, 
  ExternalLink, FileCheck, Sparkles, Target
} from 'lucide-react';

interface Nugget {
  rank: number;
  title: string;
  price: number;
  km: number;
  link: string;
  expert_reason: string;
}

const rankColors = [
  'from-amber-400 to-yellow-500',    // #1 Gold
  'from-slate-300 to-slate-400',      // #2 Silver
  'from-amber-600 to-orange-700',     // #3 Bronze
  'from-indigo-400 to-indigo-500',    // #4
  'from-indigo-300 to-indigo-400',    // #5
];

const rankLabels = ['🥇', '🥈', '🥉', '4e', '5e'];

const NuggetHunter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [budget, setBudget] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingTexts = [
    'Connexion au radar Leboncoin...',
    'Scan des annonces en cours...',
    'L\'IA analyse les meilleures offres...',
    'Classement des pépites...',
    'Finalisation du Top 5...',
  ];

  const handleSearch = async () => {
    if (!marque.trim() || !modele.trim() || !budget.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Remplissez tous les champs.' });
      return;
    }

    const budgetNum = parseInt(budget);
    if (isNaN(budgetNum) || budgetNum < 500) {
      toast({ variant: 'destructive', title: 'Budget invalide', description: 'Entrez un budget minimum de 500€.' });
      return;
    }

    setIsLoading(true);
    setNuggets([]);
    setLoadingStep(0);

    // Animate loading steps
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('hunt-nuggets', {
        body: { marque: marque.trim(), modele: modele.trim(), budget: budgetNum },
      });

      clearInterval(interval);

      if (error) {
        throw new Error(error.message || 'Erreur réseau');
      }

      if (data?.error) {
        toast({ variant: 'destructive', title: 'Aucun résultat', description: data.error });
        return;
      }

      if (data?.top5) {
        setNuggets(data.top5);
        toast({ title: `${data.top5.length} pépites trouvées ! 🏆`, description: 'L\'IA a sélectionné les meilleures offres.' });
      }
    } catch (err: any) {
      console.error('Hunt error:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: err.message || 'Impossible de scanner le marché.' });
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleAudit = (link: string) => {
    // Navigate to audit page with the URL pre-filled
    navigate(`/audit?url=${encodeURIComponent(link)}`);
  };

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <Card className="rounded-[2rem] border-slate-100 shadow-xl bg-white overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl -ml-8 -mb-8" />
          <div className="relative z-10 flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Le Chasseur de Pépites</h2>
              <p className="text-indigo-200 font-medium text-sm">Scan IA gratuit du marché Leboncoin • Top 5 des meilleures affaires</p>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Marque</Label>
              <Input
                placeholder="ex: Peugeot"
                value={marque}
                onChange={e => setMarque(e.target.value)}
                className="h-12 font-medium rounded-xl border-slate-200"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Modèle</Label>
              <Input
                placeholder="ex: 308"
                value={modele}
                onChange={e => setModele(e.target.value)}
                className="h-12 font-medium rounded-xl border-slate-200"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Budget Max (€)</Label>
              <Input
                type="number"
                placeholder="ex: 15000"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="h-12 font-medium rounded-xl border-slate-200"
                disabled={isLoading}
                min={500}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white h-13 px-8 rounded-xl font-bold shadow-lg shadow-indigo-200 text-base"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Radar className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Scan en cours...' : 'Lancer le Radar'}
          </Button>

          <p className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Gratuit — ne consomme aucun crédit
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="rounded-[2rem] border-slate-100 shadow-xl bg-white overflow-hidden">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center border border-indigo-100 shadow-inner">
                <ScanSearch className="w-12 h-12 text-indigo-600 animate-pulse" />
              </div>
              <div className="absolute inset-0 border-2 border-indigo-300/40 rounded-3xl animate-ping" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">
              {loadingTexts[loadingStep]}
            </h3>
            <p className="text-slate-500 font-medium max-w-md">
              L'IA Gemini analyse les annonces Leboncoin pour trouver les meilleures affaires sur {marque} {modele}.
            </p>
            <div className="w-64 bg-slate-100 rounded-full h-2 mt-8 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(loadingStep + 1) * 20}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      {!isLoading && nuggets.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Top {nuggets.length} Pépites
            </h3>
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-bold">
              {marque} {modele} &lt; {parseInt(budget).toLocaleString('fr-FR')}€
            </Badge>
          </div>

          <div className="grid gap-5">
            {nuggets.map((nugget, i) => (
              <Card
                key={i}
                className="rounded-2xl border-slate-100 shadow-md bg-white hover:shadow-xl hover:border-indigo-200 transition-all overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Rank badge */}
                    <div className={`sm:w-20 flex items-center justify-center bg-gradient-to-br ${rankColors[i] || rankColors[4]} p-4 sm:p-0`}>
                      <span className="text-3xl font-black text-white drop-shadow-md">
                        {rankLabels[i] || `${nugget.rank}e`}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-lg text-slate-900 truncate mb-2 group-hover:text-indigo-600 transition-colors">
                          {nugget.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold gap-1">
                            <Euro className="w-3 h-3" /> {nugget.price.toLocaleString('fr-FR')} €
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold gap-1">
                            <Gauge className="w-3 h-3" /> {nugget.km.toLocaleString('fr-FR')} km
                          </Badge>
                        </div>
                        <p className="text-sm text-indigo-600 font-bold flex items-start gap-1.5">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          {nugget.expert_reason}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:shrink-0">
                        <Button
                          onClick={() => handleAudit(nugget.link)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-5 shadow-lg shadow-indigo-200 whitespace-nowrap"
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          Expertise (1 Crédit)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-indigo-600 font-medium text-xs"
                          onClick={() => window.open(nugget.link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> Voir l'annonce
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NuggetHunter;
