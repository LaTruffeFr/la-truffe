import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2, Check, Car, FolderOpen, Gauge, Calendar, Fuel, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComparisonResult {
  winner_index: number;
  verdict: string;
  comparison_points: { criteria: string; values: string[] }[];
}

interface GarageTabProps {
  userId: string;
  reports: any[];
  isLoading: boolean;
}

/** Extract image from report's market_data or vehicles_data */
const getReportImage = (report: any): string | null => {
  if (report.market_data?.image_url) return report.market_data.image_url;
  if (report.market_data?.screenshot) return `data:image/png;base64,${report.market_data.screenshot}`;
  const vehicles = report.vehicles_data;
  if (Array.isArray(vehicles) && vehicles.length > 0 && vehicles[0]?.image) return vehicles[0].image;
  return null;
};

const GarageTab = ({ userId, reports, isLoading }: GarageTabProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const selectedReports = useMemo(
    () => reports.filter(r => selected.includes(r.id)),
    [reports, selected]
  );

  const launchComparison = async () => {
    const vehicles = selectedReports.map(r => ({
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

  const getScoreColor = (pa: number | null, pe: number | null) => {
    if (!pa || !pe) return 'text-slate-400';
    if (pa / pe > 1.1) return 'text-red-500';
    if (pa / pe < 0.95) return 'text-emerald-500';
    return 'text-amber-500';
  };

  if (isLoading) {
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
              const imageUrl = getReportImage(report);
              const prixAnnonce = report.prix_affiche;
              const coteTruffe = report.prix_estime;

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
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-indigo-600 text-white rounded-full p-1.5 shadow-lg z-10 animate-in zoom-in-50 duration-200">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Image or Placeholder */}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${report.marque} ${report.modele}`}
                      className="h-32 w-full object-cover rounded-2xl mb-4"
                    />
                  ) : (
                    <div className="h-32 w-full rounded-2xl mb-4 bg-slate-100 flex items-center justify-center">
                      <Car className="w-12 h-12 text-slate-300" />
                    </div>
                  )}

                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
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
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-indigo-600">
                        {prixAnnonce ? prixAnnonce.toLocaleString('fr-FR') : '—'}
                        <span className="text-sm font-bold ml-0.5">€</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Prix annonce</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    {report.kilometrage && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Gauge className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{(report.kilometrage / 1000).toFixed(0)}k</span>
                        <span className="text-slate-400 text-xs">km</span>
                      </div>
                    )}
                    {coteTruffe && (
                      <div className="flex items-center gap-1.5 text-sm ml-auto">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Cote Truffe</span>
                        <span className={`font-black ${getScoreColor(prixAnnonce, coteTruffe)}`}>
                          {coteTruffe.toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    )}
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
        <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-[2.5rem] bg-white gap-0">

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

              {/* Comparison Grid */}
              <div className="p-4 md:p-8 overflow-x-auto">
                <div
                  className="min-w-[600px]"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `180px repeat(${selectedReports.length}, 1fr)`,
                    gap: 0,
                  }}
                >
                  {/* ---- HEADER ROW ---- */}
                  <div />
                  {selectedReports.map((r, i) => {
                    const img = getReportImage(r);
                    const isWinner = i === result.winner_index;
                    return (
                      <div
                        key={r.id}
                        className={`mx-2 rounded-2xl p-4 text-center transition-all ${
                          isWinner
                            ? 'bg-amber-50 border-2 border-amber-300 shadow-md'
                            : 'bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        {isWinner && <div className="text-3xl mb-2">👑</div>}
                        {img ? (
                          <img src={img} alt={`${r.marque} ${r.modele}`} className="h-40 w-full object-cover rounded-xl mb-3" />
                        ) : (
                          <div className="h-40 w-full rounded-xl mb-3 bg-slate-100 flex items-center justify-center">
                            <Car className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <h3 className="font-black text-base text-slate-900 line-clamp-1">{r.marque} {r.modele}</h3>
                        <p className="text-xl font-black text-indigo-600 mt-1">
                          {r.prix_affiche ? `${r.prix_affiche.toLocaleString('fr-FR')} €` : '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                          {r.annee || ''}{r.annee && r.kilometrage ? ' • ' : ''}{r.kilometrage ? `${(r.kilometrage / 1000).toFixed(0)}k km` : ''}
                        </p>
                      </div>
                    );
                  })}

                  {/* ---- DATA ROWS ---- */}
                  {[
                    {
                      label: 'Prix annonce',
                      render: (r: any) => r.prix_affiche
                        ? <span className="font-black text-lg text-slate-900">{r.prix_affiche.toLocaleString('fr-FR')} €</span>
                        : <span className="text-slate-300">—</span>,
                    },
                    {
                      label: 'Cote La Truffe',
                      render: (r: any) => r.prix_estime
                        ? <span className={`font-black text-lg ${r.prix_affiche && r.prix_affiche > r.prix_estime ? 'text-red-500' : 'text-emerald-500'}`}>
                            {r.prix_estime.toLocaleString('fr-FR')} €
                          </span>
                        : <span className="text-slate-300">—</span>,
                    },
                    {
                      label: 'Kilométrage',
                      render: (r: any) => r.kilometrage
                        ? <span className="font-bold text-slate-700">{r.kilometrage.toLocaleString('fr-FR')} km</span>
                        : <span className="text-slate-300">—</span>,
                    },
                    {
                      label: 'Année',
                      render: (r: any) => r.annee
                        ? <span className="font-bold text-slate-700">{r.annee}</span>
                        : <span className="text-slate-300">—</span>,
                    },
                  ].map((row, idx) => (
                    <React.Fragment key={`data-${idx}`}>
                      <div className="flex items-center border-b border-slate-100 py-4 pr-4">
                        <span className="font-bold text-sm text-slate-500">{row.label}</span>
                      </div>
                      {selectedReports.map((r, i) => (
                        <div
                          key={r.id}
                          className={`flex items-center justify-center border-b border-slate-100 py-4 mx-2 ${
                            i === result.winner_index ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          {row.render(r)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}

                  {/* ---- AI COMPARISON ROWS ---- */}
                  {result.comparison_points.map((point, idx) => (
                    <React.Fragment key={`ai-${idx}`}>
                      <div className="flex items-start border-b border-slate-100 py-4 pr-4 last:border-0">
                        <span className="font-bold text-sm text-slate-500">{point.criteria}</span>
                      </div>
                      {point.values.map((val, i) => (
                        <div
                          key={i}
                          className={`border-b border-slate-100 py-4 px-3 mx-2 text-sm text-slate-700 font-medium leading-relaxed last:border-0 ${
                            i === result.winner_index ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          {val}
                        </div>
                      ))}
                    </React.Fragment>
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
