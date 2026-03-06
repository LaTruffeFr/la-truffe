import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { 
  Download, CheckCircle2, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, Loader2, History, Calculator, FileCheck, Copy, Check, Settings2, 
  Cpu, ScanSearch, Activity, Receipt, Hash, ShieldAlert, Sparkles, Snowflake, 
  Flame, CircleDashed, ExternalLink, Wrench
} from "lucide-react";
import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

const getOptionIcon = (opt: string) => {
  const text = opt.toLowerCase();
  if (text.includes('pompe') || text.includes('clim')) return <Snowflake className="w-4 h-4 text-blue-500" />;
  if (text.includes('siège') || text.includes('chauffant')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (text.includes('jante')) return <CircleDashed className="w-4 h-4 text-slate-700" />;
  if (text.includes('auto') || text.includes('caméra') || text.includes('radar') || text.includes('carplay') || text.includes('écran')) return <Cpu className="w-4 h-4 text-purple-500" />;
  return <Settings2 className="w-4 h-4 text-slate-500" />;
};

function calculateLogTrendLine(data: any[]): { type: string; a: number; b: number } {
  if (!data || data.length < 2) return { type: 'log', a: 0, b: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0; let count = 0;
  data.forEach(v => {
    if (v.kilometrage > 100 && v.prix > 1000) {
      const x = Math.log(v.kilometrage); const y = v.prix;
      sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; count++;
    }
  });
  if (count < 2) return { type: 'log', a: 0, b: 0 };
  const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / count;
  return { type: 'log', a: intercept, b: slope };
}

const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto drop-shadow-lg">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mt-1">
        <span className={`text-4xl font-black tracking-tighter ${colorClass}`}>{score}</span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trust Score</span>
      </div>
    </div>
  );
};

const PROGRESS_STEPS = [
  { time: 1000, label: "Extraction sécurisée des données de l'annonce...", icon: ScanSearch },
  { time: 3500, label: "Identification du bloc moteur & spécifications...", icon: Cpu },
  { time: 7000, label: "Recherche d'incohérences et vices cachés...", icon: ShieldAlert },
  { time: 10000, label: "Analyse financière et calcul de la vraie cote...", icon: Calculator },
  { time: 13000, label: "Édition de votre rapport d'expertise...", icon: FileCheck },
];

const formatText = (text: string) => {
  if (!text) return null;
  const formattedLines = text.replace(/(?:\n- |- )(?=\*\*)/g, '||BULLET||**').split('||BULLET||');
  const intro = formattedLines[0];
  const bullets = formattedLines.slice(1);

  if (bullets.length === 0) {
    return (
      <div className="space-y-3">
        {text.split('\n').map((line, i) => {
          if (!line.trim()) return null;
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i} className="text-slate-600 font-medium leading-relaxed">
              {parts.map((p, j) => 
                p.startsWith('**') && p.endsWith('**') 
                  ? <strong key={j} className="text-slate-900 font-black">{p.slice(2, -2)}</strong> 
                  : p
              )}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="text-slate-600 font-medium leading-relaxed space-y-4">
      {intro && <p>{intro.trim()}</p>}
      <ul className="space-y-3">
        {bullets.map((bullet, i) => {
          const parts = bullet.split(/(\*\*.*?\*\*)/g);
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <div className="flex-1">
                {parts.map((p, j) => 
                  p.startsWith('**') && p.endsWith('**') 
                    ? <strong key={j} className="text-slate-900 font-black">{p.slice(2, -2)}</strong> 
                    : p
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const fetchReport = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/client'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchReport(); }, [id]);

  const isSingleAudit = useMemo(() => report?.market_data?.type === 'single_audit', [report]);
  const singleAuditData = useMemo(() => isSingleAudit ? report?.market_data : null, [report, isSingleAudit]);
  const vehiclesData = useMemo(() => report?.vehicles_data || [], [report]);

  const stats = useMemo(() => {
    if (!report) return null;
    const pAffiche = Number(report.prix_affiche || report.prix_moyen || 0);
    const pCible = Number(report.prix_truffe || report.prix_estime || pAffiche);
    const score = isSingleAudit ? (singleAuditData?.score || 50) : (vehiclesData[0]?.dealScore || 50);
    return { 
      prixAffiche: pAffiche, prixCible: pCible, economy: pAffiche - pCible,
      score, isGoodDeal: pAffiche <= pCible,
      totalVehicules: isSingleAudit ? 1 : (report.total_vehicules || vehiclesData.length)
    };
  }, [report, isSingleAudit, vehiclesData, singleAuditData]);

  const negotiationPoints = useMemo(() => {
    if (!report) return [];
    if (report.negotiation_points) return report.negotiation_points;
    if (report.negotiation_arguments) {
        try { const parsed = JSON.parse(report.negotiation_arguments); if (Array.isArray(parsed)) return parsed; } catch {}
    }
    return [];
  }, [report]);

  const signaux = useMemo(() => {
    const allTags = singleAuditData?.tags || [];
    return allTags.slice(0, 8).map((tag: string) => ({
      label: tag,
      type: (tag.includes('⚠️') || tag.includes('💀') || tag.includes('🚨')) ? 'destructive' : 'success'
    }));
  }, [singleAuditData]);

  useEffect(() => {
    if (report?.status !== 'in_progress' && report?.status !== 'pending') return;
    const startTime = Date.now();
    let animationFrameId: number;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const targetPercent = Math.min((elapsed / 10000) * 100, 95);
      setProgressPercent(targetPercent);
      if (targetPercent < 95) animationFrameId = requestAnimationFrame(updateProgress);
    };
    animationFrameId = requestAnimationFrame(updateProgress);
    PROGRESS_STEPS.forEach((step, index) => { setTimeout(() => setProgressIndex(index), step.time); });
    return () => cancelAnimationFrame(animationFrameId);
  }, [report?.status]);

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "L'argumentaire est copié dans le presse-papier." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    toast({ title: "Génération PDF...", description: "Veuillez patienter." });
    const success = await generatePDF('report-content', `Expertise_La_Truffe_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "Rapport PDF téléchargé." });
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Initialisation...</p>
    </div>
  );

  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-10 animate-in fade-in duration-700">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-white rounded-3xl shadow-xl border border-indigo-50">
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit en cours</h2>
            <p className="text-slate-500 font-medium">Notre algorithme traque la moindre faille sur ce véhicule...</p>
          </div>
          <div className="space-y-4 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <Progress value={progressPercent} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />
            <div className="pt-4 space-y-4">
              {PROGRESS_STEPS.map((step, index) => (
                <div key={index} className={`flex items-center gap-4 transition-all duration-500 ${index === progressIndex ? "scale-105 text-indigo-600" : index < progressIndex ? "text-emerald-500 opacity-70" : "text-slate-300 opacity-50"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${index === progressIndex ? "bg-indigo-50" : "bg-slate-50"}`}>
                    {index < progressIndex ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-bold ${index === progressIndex ? "tracking-wide" : ""}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageCover = isSingleAudit ? (singleAuditData?.image_url || `data:image/png;base64,${singleAuditData?.screenshot}`) : vehiclesData[0]?.image;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-4 md:px-6 print:hidden">
        <div className="container mx-auto flex items-center justify-between max-w-6xl">
          <Link to="/" className="font-black text-xl tracking-tighter text-slate-900 flex items-center gap-2">
            La Truffe <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] uppercase tracking-widest h-5">Certifié</Badge>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')} className="font-bold text-slate-500 hidden sm:flex">Retour</Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 sm:mr-2" />} 
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-10 max-w-6xl space-y-8">
        
        {/* --- HERO : LE CHARME RETROUVÉ --- */}
        <div className="pdf-section flex flex-col md:flex-row items-center md:items-start gap-8 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative group">
            <img src={imageCover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Vehicule" />
            <div className="absolute top-3 left-3">
               <Badge className="bg-black/60 backdrop-blur-md text-white border-0 shadow-sm">{isSingleAudit ? 'Audit Annonce' : 'Audit Marché'}</Badge>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">
              <Hash className="w-3 h-3" /> Dossier {report.id.slice(0,8)} • <History className="w-3 h-3 ml-2" /> {new Date(report.created_at).toLocaleDateString()}
            </div>
            {report.market_data?.original_title ? (
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-6">
                {report.market_data.original_title}
              </h1>
            ) : (
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                {report.marque} <span className="text-indigo-600">{report.modele}</span>
              </h1>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                <Calendar className="w-4 h-4 text-indigo-500" /> {report.annee}
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                <Gauge className="w-4 h-4 text-emerald-500" /> {safeNum(report.kilometrage)} km
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-2 capitalize shadow-sm">
                <Fuel className="w-4 h-4 text-amber-500" /> {report.carburant || 'Essence'}
              </div>
              {report.transmission && (
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-2 capitalize shadow-sm">
                  <Settings2 className="w-4 h-4 text-slate-500" /> {report.transmission}
                </div>
              )}
              {report.lien_annonce && (
                <a 
                  href={report.lien_annonce} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ml-0 md:ml-2"
                >
                  <ExternalLink className="w-4 h-4" /> Voir l'annonce
                </a>
              )}
            </div>
          </div>
        </div>

        {/* --- LA TRINITÉ (SCORE, PRIX) --- */}
        <div className="pdf-section grid lg:grid-cols-3 gap-6">
          
          {/* Card Score */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl bg-white overflow-hidden flex flex-col justify-center p-6 relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
            <CardContent className="text-center p-0 pt-4">
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-6 font-black text-slate-900 text-lg uppercase tracking-tight">
                {stats.score >= 80 ? "Achat Recommandé" : stats.score >= 60 ? "Négociation Requise" : "Vigilance Absolue"}
              </p>
              <p className="text-slate-400 text-xs font-bold mt-1">Basé sur {stats.totalVehicules} annonces</p>
            </CardContent>
          </Card>

          {/* Card Prix */}
          <Card className="lg:col-span-2 rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white overflow-hidden p-8 relative">
            <div className="absolute right-0 top-0 p-8 opacity-5"><Euro className="w-48 h-48" /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/10 pb-6 mb-6">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">{isSingleAudit ? 'Prix de l\'annonce' : 'Moyenne du marché'}</p>
                  <p className={`text-3xl font-black ${stats.economy > 0 ? 'text-white/30 line-through decoration-rose-500' : 'text-white'}`}>
                    {safeNum(stats.prixAffiche)} €
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2 flex items-center sm:justify-end gap-1.5">
                    <CheckCircle2 className="w-4 h-4"/> Cote La Truffe
                  </p>
                  <p className="text-5xl md:text-6xl font-[1000] tracking-tighter leading-none">{safeNum(stats.prixCible)} €</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">Marge de négociation</p>
                    <p className="text-2xl font-black text-emerald-400">-{safeNum(Math.abs(stats.economy))} €</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* --- VERDICT IA --- */}
        <div className="pdf-section bg-white border border-indigo-100/60 rounded-[2rem] p-6 shadow-lg shadow-indigo-100/20 flex flex-col sm:flex-row items-start gap-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
          <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 shrink-0 relative z-10">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1 space-y-3 relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Diagnostic Expert</h2>
            <p className="text-base font-medium text-slate-700 leading-relaxed">
              {report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse du profil en cours d'écriture..."}
            </p>
            {signaux.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {signaux.map((s: any, i: number) => (
                  <Badge key={i} className={`font-bold text-[10px] px-2.5 py-0.5 border-0 ${s.type === 'destructive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {s.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- SECTION DÉTAILS : PLAYBOOK & DEVIS --- */}
        <div className="pdf-section grid lg:grid-cols-3 gap-8 pt-4">
          
          {/* Colonne Gauche : Diagnostic & SMS */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500" /> Diagnostic & Playbook
            </h3>
            
            <div className="space-y-6">
              {negotiationPoints.map((nego: any, i: number) => {
                const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                const smsText = smsMatch ? smsMatch[1].trim() : null;
                
                return (
                  <Card key={i} className="border-slate-100 shadow-md rounded-[2rem] overflow-hidden break-inside-avoid hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                          {i+1}
                        </div>
                        <div className="flex-1 space-y-4">
                          <h4 className="font-black text-xl text-slate-900">{nego.titre}</h4>
                          
                          {smsText ? (
                            <>
                              {formatText(nego.desc.split(smsMatch[0])[0])}
                              {/* NOUVEAU DESIGN BULLE SMS (Dark Premium) */}
                              <div className="bg-slate-900 text-white p-6 rounded-[2rem] rounded-tl-sm shadow-xl relative group max-w-lg mt-6 break-inside-avoid">
                                 <p className="text-base font-medium italic text-slate-100 leading-relaxed">"{smsText}"</p>
                                 <Button onClick={() => handleCopySMS(smsText)} className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl border-4 border-white hover:bg-indigo-700 transition-transform active:scale-95 p-0">
                                   {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                                 </Button>
                              </div>
                            </>
                          ) : (
                            formatText(nego.desc)
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Colonne Droite : Entretiens Récents, Devis & Options */}
          <div className="space-y-8">
            
            {/* SECTION ENTRETIENS RÉCENTS (VERTE) */}
            {isSingleAudit && (() => {
              const entretiens = singleAuditData?.entretiens_recents || (report?.market_data?.entretiens_recents);
              if (!Array.isArray(entretiens) || entretiens.length === 0) return null;
              return (
                <div className="space-y-4 break-inside-avoid">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Wrench className="text-emerald-500 w-5 h-5" /> Entretiens Récents
                  </h3>
                  <Card className="rounded-[2rem] border-emerald-200 shadow-lg overflow-hidden bg-emerald-50/30">
                    <div className="bg-emerald-50/80 px-6 py-4 border-b border-emerald-100">
                      <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Travaux déclarés par le vendeur</p>
                    </div>
                    <div className="divide-y divide-emerald-100/50">
                      {entretiens.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 px-6 py-4">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-bold text-sm leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* SECTION FACTURE (ROUGE) */}
            {isSingleAudit && (() => {
              let devisItems: any[] = [];
              try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
              if (devisItems.length === 0) return null;
              const total = devisItems.reduce((s, d) => s + (d.cout_euros || 0), 0);
              
              return (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="text-slate-400 w-5 h-5" /> Facture Prévisionnelle
                  </h3>
                  <Card className="rounded-[2rem] border-slate-200 shadow-lg overflow-hidden bg-white break-inside-avoid">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frais immédiats à prévoir</p>
                    </div>
                    <div className="divide-y divide-dashed divide-slate-200">
                      {devisItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-6 py-4">
                          <span className="text-slate-600 font-bold text-sm pr-4 leading-tight">{item.piece}</span>
                          <span className="text-slate-900 font-black whitespace-nowrap">+{safeNum(item.cout_euros)} €</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-50 px-6 py-6 flex justify-between items-center border-t-2 border-rose-200 shadow-inner">
                      <span className="font-black text-rose-900 uppercase text-xs tracking-widest">Total Malus</span>
                      <span className="text-2xl font-black text-rose-600 tracking-tighter">{safeNum(total)} €</span>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* SECTION ÉQUIPEMENTS CLÉS (VIOLET) */}
            <div className="space-y-4 break-inside-avoid">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Cpu className="text-indigo-500 w-5 h-5" /> Équipements Clés
              </h3>
              <div className="grid gap-3">
                {Array.isArray(singleAuditData?.options) && singleAuditData.options.length > 0 ? (
                  singleAuditData.options.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
                        {getOptionIcon(opt)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm leading-tight">{opt}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-500 italic text-sm">Aucun équipement spécifique ou modification détecté.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* --- RADAR SNIPER --- */}
        {!isSingleAudit && vehiclesData.length > 0 && (
          <div className="pt-12 border-t border-slate-200 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Analyse de Marché</h2>
                <p className="text-slate-500 font-bold mt-1">Positionnement de l'offre sur {stats.totalVehicules} annonces.</p>
              </div>
              <Badge className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest border-0">Data Live</Badge>
            </div>
            <Card className="rounded-[3rem] shadow-xl border-0 overflow-hidden h-[500px] bg-slate-950 p-6">
              <SniperChart data={vehiclesData} trendLine={calculateLogTrendLine(vehiclesData)} onVehicleClick={setSelectedVehicle} />
            </Card>
          </div>
        )}

      </main>
      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
};

export default ReportView;
