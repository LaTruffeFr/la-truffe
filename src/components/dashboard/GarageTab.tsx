import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2, Crown, Trophy, Check, Car, FolderOpen, Gauge, Calendar, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  const getScoreColor = (prix_affiche: number | null, prix_estime: number | null) => {
    if (!prix_affiche || !prix_estime) return 'text-slate-400';
    const ratio = prix_affiche / prix_estime;
    if (ratio > 1.1) return 'text-red-500';
    if (ratio < 0.95) return 'text-emerald-500';
    return 'text-amber-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Mon Garage</h2>
        <p className="text-slate-500 mt-2 text-base">
          Sélectionnez jusqu'à <span className="font-bold text-slate-700">3 véhicules</span> pour un face-à-face impitoyable.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border-2 border-dashed border-slate-200 min-h-[400px] flex flex-col items-center justify-center text-center p-10">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Aucun audit terminé</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
            Lancez d'abord un audit pour pouvoir comparer vos véhicules côte à côte.
          </p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 rounded-xl font-bold" onClick={() => navigate('/audit')}>
            Lancer mon premier audit
          </Button>
        </div>
      ) : (
        <>
          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {reports.map(report => {
              const isSelected = selected.includes(report.id);
              return (
                <div
                  key={report.id}
                  onClick={() => toggleSelect(report.id)}
                  className={`bg-white rounded-3xl p-5 shadow-lg shadow-slate-200/40 border-2 transition-all duration-300 cursor-pointer relative group ${
                    isSelected
                      ? 'border-indigo-600 ring-4 ring-indigo-600/20 scale-[1.02]'
                      : 'border-slate-100 hover:border-indigo-300 hover:shadow-indigo-100'
                  }`}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-indigo-600 text-white rounded-full p-1.5 shadow-lg z-10 animate-in zoom-in-50 duration-200">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Card content */}
                  <div className="flex flex-col">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-black text-lg text-slate-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                          {report.marque} {report.modele}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {report.annee && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              <Calendar className="w-3 h-3" /> {report.annee}
                            </span>
                          )}
                          {report.carburant && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg capitalize">
                              <Fuel className="w-3 h-3" /> {report.carburant}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-indigo-600">
                          {report.prix_affiche ? report.prix_affiche.toLocaleString('fr-FR') : '—'}
                          <span className="text-sm font-bold ml-0.5">€</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                      {report.kilometrage && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Gauge className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{(report.kilometrage / 1000).toFixed(0)}k</span>
                          <span className="text-slate-400 text-xs">km</span>
                        </div>
                      )}
                      {report.prix_estime && (
                        <div className="flex items-center gap-1.5 text-sm ml-auto">
                          <span className="text-xs text-slate-400">Estimation</span>
                          <span className={`font-black ${getScoreColor(report.prix_affiche, report.prix_estime)}`}>
                            {report.prix_estime.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selection counter */}
          {selected.length > 0 && (
            <p className="text-center mt-5 text-sm font-semibold text-slate-400">
              {selected.length} / 3 sélectionné{selected.length > 1 ? 's' : ''}
            </p>
          )}

          {/* CTA Button */}
          {selected.length >= 2 && (
            <div className="sticky bottom-6 z-30 mt-8 animate-in slide-in-from-bottom-4 duration-300">
              <button
                onClick={launchComparison}
                className="bg-indigo-900 text-white px-8 py-4 rounded-full shadow-2xl hover:bg-indigo-800 hover:scale-105 transition-all flex items-center justify-center gap-3 font-bold text-lg ring-4 ring-indigo-900/30 w-full md:w-auto mx-auto"
              >
                <Swords className="w-5 h-5" />
                Lancer le Face-à-Face
                <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full ml-1">Gratuit</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== COMPARISON MODAL ===== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-5xl rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl gap-0 bg-white">

          {comparing ? (
            <div className="flex flex-col items-center justify-center py-28 gap-5 px-8">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center shadow-inner">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              </div>
              <p className="text-xl font-black text-slate-900">La Truffe délibère...</p>
              <p className="text-sm text-slate-400 font-medium">Analyse comparative en cours entre {selectedReports.length} véhicules</p>
            </div>
          ) : result ? (
            <>
              {/* Winner Banner */}
              <div className="bg-gradient-to-br from-amber-100 to-orange-50 p-8 md:p-10 text-center border-b border-amber-200">
                <div className="text-4xl mb-3">👑</div>
                <p className="uppercase tracking-widest text-amber-700 font-bold text-sm mb-2">
                  🏆 Le Choix de La Truffe
                </p>
                <h2 className="text-3xl font-black text-amber-950 mt-1">
                  {selectedReports[result.winner_index]?.marque} {selectedReports[result.winner_index]?.modele}
                </h2>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl text-amber-900 font-medium mt-5 inline-block max-w-2xl mx-auto text-sm leading-relaxed shadow-sm">
                  {result.verdict}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 md:p-10">
                {/* Column headers */}
                <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `200px repeat(${selectedReports.length}, 1fr)` }}>
                  <div />
                  {selectedReports.map((r, i) => (
                    <div
                      key={r.id}
                      className={`text-center rounded-2xl p-4 transition-all ${
                        i === result.winner_index
                          ? 'bg-amber-50 border-2 border-amber-200'
                          : 'bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        {i === result.winner_index && <Crown className="w-4 h-4 text-amber-500" />}
                        <span className="font-black text-sm text-slate-900">{r.marque}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{r.modele}</span>
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                <div className="space-y-0">
                  {/* Fixed rows */}
                  {[
                    {
                      label: 'Prix affiché',
                      render: (r: any) => r.prix_affiche ? (
                        <span className="font-black text-lg text-slate-900">{r.prix_affiche.toLocaleString('fr-FR')} €</span>
                      ) : <span className="text-slate-300">—</span>
                    },
                    {
                      label: 'Kilométrage',
                      render: (r: any) => r.kilometrage ? (
                        <span className="font-bold text-slate-700">{r.kilometrage.toLocaleString('fr-FR')} km</span>
                      ) : <span className="text-slate-300">—</span>
                    },
                    {
                      label: 'Année',
                      render: (r: any) => r.annee ? (
                        <span className="font-bold text-slate-700">{r.annee}</span>
                      ) : <span className="text-slate-300">—</span>
                    },
                    {
                      label: 'Estimation Truffe',
                      render: (r: any) => r.prix_estime ? (
                        <span className={`font-black text-lg ${r.prix_affiche && r.prix_affiche > r.prix_estime ? 'text-red-500' : 'text-emerald-500'}`}>
                          {r.prix_estime.toLocaleString('fr-FR')} €
                        </span>
                      ) : <span className="text-slate-300">—</span>
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="grid items-center gap-4 border-b border-slate-100 py-4"
                      style={{ gridTemplateColumns: `200px repeat(${selectedReports.length}, 1fr)` }}
                    >
                      <div className="text-sm font-bold text-slate-500">{row.label}</div>
                      {selectedReports.map((r, i) => (
                        <div key={r.id} className={`text-center ${i === result.winner_index ? 'bg-amber-50/50 rounded-xl py-1' : ''}`}>
                          {row.render(r)}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* AI comparison rows */}
                  {result.comparison_points.map((point, idx) => (
                    <div
                      key={`ai-${idx}`}
                      className="grid items-start gap-4 border-b border-slate-100 py-4 last:border-0"
                      style={{ gridTemplateColumns: `200px repeat(${selectedReports.length}, 1fr)` }}
                    >
                      <div className="text-sm font-bold text-slate-500 pt-0.5">{point.criteria}</div>
                      {point.values.map((val, i) => (
                        <div
                          key={i}
                          className={`text-sm leading-relaxed text-slate-700 font-medium ${i === result.winner_index ? 'bg-amber-50/50 rounded-xl p-2 -m-2' : ''}`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default GarageTab;
