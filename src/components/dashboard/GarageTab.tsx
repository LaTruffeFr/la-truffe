import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2, Crown, Trophy, Check, Car, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComparisonResult {
  winner_index: number;
  verdict: string;
  comparison_points: { criteria: string; values: string[] }[];
}

interface GarageTabProps {
  userId: string;
}

const GarageTab = ({ userId }: GarageTabProps) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
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
    fetchReports();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mon Garage</h2>
          <p className="text-slate-500 font-medium mt-1">
            Sélectionnez jusqu'à 3 véhicules pour un <span className="font-bold text-slate-700">face-à-face impitoyable</span>.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="border-slate-200 shadow-sm border-dashed rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Aucun audit terminé</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
            Lancez d'abord un audit pour pouvoir comparer vos véhicules.
          </p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 rounded-xl font-bold" onClick={() => navigate('/audit')}>
            Lancer mon premier audit
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reports.map(report => {
              const isSelected = selected.includes(report.id);
              return (
                <Card
                  key={report.id}
                  onClick={() => toggleSelect(report.id)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                    isSelected
                      ? 'ring-3 ring-indigo-500 shadow-lg shadow-indigo-100 bg-indigo-50/30'
                      : 'hover:ring-1 hover:ring-slate-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg z-10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {report.marque} {report.modele}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {report.annee || '—'} • {report.kilometrage ? `${(report.kilometrage / 1000).toFixed(0)}k km` : '—'}
                        </p>
                      </div>
                      {report.prix_affiche && (
                        <Badge variant="secondary" className="font-bold text-sm">
                          {report.prix_affiche.toLocaleString('fr-FR')} €
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {report.carburant && <span className="capitalize">{report.carburant}</span>}
                      {report.transmission && <span className="capitalize">{report.transmission}</span>}
                      <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {report.prix_estime && report.prix_affiche && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Estimation La Truffe</span>
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

          {selected.length > 0 && (
            <div className="text-center mt-6 text-sm text-slate-500">
              {selected.length}/3 véhicule{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
            </div>
          )}

          {selected.length >= 2 && (
            <div className="flex justify-center mt-6">
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
        </>
      )}

      {/* Comparison Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Swords className="w-6 h-6 text-indigo-600" />
              Face-à-Face
            </DialogTitle>
          </DialogHeader>

          {comparing ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
              <p className="text-lg font-bold text-slate-700">La Truffe délibère entre ces modèles...</p>
              <p className="text-sm text-slate-400">Analyse comparative en cours</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Winner Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 text-center">
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
                    {result.comparison_points.map((point, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-slate-700">{point.criteria}</TableCell>
                        {point.values.map((val, i) => (
                          <TableCell key={i} className={`text-sm leading-relaxed ${i === result.winner_index ? 'bg-amber-50/50' : ''}`}>
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
    </section>
  );
};

export default GarageTab;
