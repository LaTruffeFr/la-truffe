import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2, Crown, Trophy, Check, Car } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComparisonResult {
  winner_index: number;
  verdict: string;
  comparison_points: { criteria: string; values: string[] }[];
}

const GarageView = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) fetchReports();
  }, [user, authLoading]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Impossible de charger vos audits.');
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.error('Maximum 3 véhicules.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const launchComparison = async () => {
    const vehicles = reports.filter(r => selected.includes(r.id)).map(r => ({
      marque: r.marque,
      modele: r.modele,
      prix_affiche: r.prix_affiche,
      prix_estime: r.prix_estime,
      kilometrage: r.kilometrage,
      annee: r.annee,
      carburant: r.carburant,
      transmission: r.transmission,
      expert_opinion: r.expert_opinion,
      ai_devis: r.market_data?.devis || [],
      score_ia: r.market_data?.score,
    }));

    setComparing(true);
    setResult(null);
    setModalOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('compare-vehicles', {
        body: { vehicles },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la comparaison.');
      setModalOpen(false);
    } finally {
      setComparing(false);
    }
  };

  const selectedReports = reports.filter(r => selected.includes(r.id));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeLink="garage" />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <Header activeLink="garage" />
      
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-32">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-full mb-4">
            <Car className="w-4 h-4" />
            Mon Garage
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Le Comparateur
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Sélectionnez jusqu'à 3 véhicules pour un <span className="font-bold text-foreground">face-à-face impitoyable</span>.
          </p>
        </div>

        {/* Grid */}
        {reports.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">Aucun audit terminé pour le moment.</p>
            <Button onClick={() => navigate('/audit')} className="mt-4">
              Lancer mon premier audit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => {
              const isSelected = selected.includes(report.id);
              return (
                <Card
                  key={report.id}
                  onClick={() => toggleSelect(report.id)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg dark:hover:shadow-none relative ${
                    isSelected
                      ? 'ring-3 ring-primary shadow-lg shadow-primary/10 bg-primary/5'
                      : 'hover:ring-1 hover:ring-slate-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-foreground text-base">
                          {report.marque} {report.modele}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {report.annee || '—'} • {report.kilometrage ? `${(report.kilometrage / 1000).toFixed(0)}k km` : '—'}
                        </p>
                      </div>
                      {report.prix_affiche && (
                        <Badge variant="secondary" className="font-bold text-sm">
                          {report.prix_affiche.toLocaleString('fr-FR')} €
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {report.carburant && <span className="capitalize">{report.carburant}</span>}
                      {report.transmission && <span className="capitalize">{report.transmission}</span>}
                      <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {report.prix_estime && report.prix_affiche && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estimation La Truffe</span>
                          <span className={`font-bold ${report.prix_affiche > report.prix_estime ? 'text-red-600' : 'text-emerald-600'}`}>
                            {report.prix_estime.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Selected count */}
        {selected.length > 0 && (
          <div className="text-center mt-6 text-sm text-muted-foreground">
            {selected.length}/3 véhicule{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
          </div>
        )}
      </main>

      {/* Floating CTA */}
      {selected.length >= 2 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 animate-in slide-in-from-bottom-4">
          <Button
            onClick={launchComparison}
            size="xl"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-base shadow-2xl shadow-indigo-300/50 rounded-2xl px-8 h-14 gap-3"
          >
            <Swords className="w-5 h-5" />
            Lancer le Face-à-Face (Gratuit)
          </Button>
        </div>
      )}

      {/* Comparison Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 md:p-6 pb-0">
            <DialogTitle className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
              <Swords className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              Face-à-Face
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 md:p-6">
          {comparing ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 gap-4">
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-indigo-600" />
              <p className="text-base md:text-lg font-bold text-foreground">La Truffe délibère entre ces modèles...</p>
              <p className="text-sm text-muted-foreground">Analyse comparative en cours</p>
            </div>
          ) : result ? (
            <div className="space-y-4 md:space-y-6">
              {/* Winner Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 text-center">
                <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h2 className="text-xl font-black text-slate-900 mb-1">
                  🏆 Le Choix de La Truffe : {selectedReports[result.winner_index]?.marque} {selectedReports[result.winner_index]?.modele}
                </h2>
                <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">{result.verdict}</p>
              </div>

              {/* Comparison Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-bold text-slate-700 w-1/4">Critère</TableHead>
                      {selectedReports.map((r, i) => (
                        <TableHead
                          key={r.id}
                          className={`font-bold text-center ${i === result.winner_index ? 'bg-amber-50 text-amber-800' : 'text-slate-700'}`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {i === result.winner_index && <Crown className="w-4 h-4 text-amber-500" />}
                            {r.marque} {r.modele}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Raw data rows */}
                    <TableRow>
                      <TableCell className="font-semibold text-slate-700">Prix affiché</TableCell>
                      {selectedReports.map((r, i) => (
                        <TableCell key={r.id} className={`text-center font-bold ${i === result.winner_index ? 'bg-amber-50/50' : ''}`}>
                          {r.prix_affiche ? `${r.prix_affiche.toLocaleString('fr-FR')} €` : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-700">Kilométrage</TableCell>
                      {selectedReports.map((r, i) => (
                        <TableCell key={r.id} className={`text-center ${i === result.winner_index ? 'bg-amber-50/50' : ''}`}>
                          {r.kilometrage ? `${r.kilometrage.toLocaleString('fr-FR')} km` : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-700">Année</TableCell>
                      {selectedReports.map((r, i) => (
                        <TableCell key={r.id} className={`text-center ${i === result.winner_index ? 'bg-amber-50/50' : ''}`}>
                          {r.annee || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-700">Estimation La Truffe</TableCell>
                      {selectedReports.map((r, i) => (
                        <TableCell key={r.id} className={`text-center font-bold ${i === result.winner_index ? 'bg-amber-50/50' : ''} ${r.prix_affiche && r.prix_estime && r.prix_affiche > r.prix_estime ? 'text-red-600' : 'text-emerald-600'}`}>
                          {r.prix_estime ? `${r.prix_estime.toLocaleString('fr-FR')} €` : '—'}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* AI comparison points */}
                    {result.comparison_points.map((point, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-slate-700">{point.criteria}</TableCell>
                        {point.values.map((val, i) => (
                          <TableCell
                            key={i}
                            className={`text-sm leading-relaxed ${i === result.winner_index ? 'bg-amber-50/50' : ''}`}
                          >
                            {val}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GarageView;
