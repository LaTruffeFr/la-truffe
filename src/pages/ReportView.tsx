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
  Euro, ShieldCheck, Loader2, History, Calculator, FileCheck, Copy, Check, Settings2, 
  Cpu, ScanSearch, Activity, Receipt, Hash, ShieldAlert, Sparkles, Snowflake, 
  Flame, CircleDashed, Target, ExternalLink, MessageSquare, Flag
} from "lucide-react";
import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';
import ReportAdModal from '@/components/reporting/ReportAdModal';

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

const getOptionIcon = (opt: string) => {
  const text = opt.toLowerCase();
  if (text.includes('pompe') || text.includes('clim')) return <Snowflake className="w-4 h-4 text-blue-500" />;
  if (text.includes('siège') || text.includes('chauffant')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (text.includes('jante')) return <CircleDashed className="w-4 h-4 text-slate-700" />;
  if (text.includes('auto') || text.includes('caméra') || text.includes('radar') || text.includes('carplay') || text.includes('écran') || text.includes('navig')) return <Cpu className="w-4 h-4 text-purple-500" />;
  return <Settings2 className="w-4 h-4 text-slate-400" />;
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
  { time: 0, label: "Flairage de l'annonce et extraction des données...", icon: ScanSearch, percent: 15 },
  { time: 3000, label: "Analyse du pedigree mécanique...", icon: Cpu, percent: 40 },
  { time: 6000, label: "Traque des vices cachés et arnaques...", icon: ShieldAlert, percent: 65 },
  { time: 9000, label: "Calcul de la vraie cote La Truffe...", icon: Calculator, percent: 85 },
  { time: 12000, label: "Rédaction finale du rapport d'expertise...", icon: FileCheck, percent: 98 },
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
  const [fastLoadStep, setFastLoadStep] = useState(0);

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

  /** Replace placeholder tokens like [PRIX_TRUFFE] in AI-generated text */
  const fillPlaceholders = (text: string): string => {
    if (!text || !stats) return text;
    return text
      .replace(/\[PRIX_TRUFFE\]/gi, stats.prixCible?.toLocaleString('fr-FR') ?? '—')
      .replace(/\[PRIX_AFFICHE\]/gi, stats.prixAffiche?.toLocaleString('fr-FR') ?? '—')
      .replace(/\[ECONOMIE\]/gi, stats.economy?.toLocaleString('fr-FR') ?? '—');
  };

  const negotiationPoints = useMemo(() => {
    if (!report) return [];
    let points: any[] = [];
    if (report.negotiation_points) points = report.negotiation_points;
    else if (report.negotiation_arguments) {
      try { const parsed = JSON.parse(report.negotiation_arguments); if (Array.isArray(parsed)) points = parsed; } catch {}
    }
    // Replace placeholders in all text fields
    return points.map((p: any) => ({
      ...p,
      desc: typeof p.desc === 'string' ? fillPlaceholders(p.desc) : p.desc,
      titre: typeof p.titre === 'string' ? fillPlaceholders(p.titre) : p.titre,
    }));
  }, [report, stats]);

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
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      let currentStepIndex = 0;
      for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
        if (elapsed >= PROGRESS_STEPS[i].time) {
          currentStepIndex = i;
          break;
        }
      }
      
      setProgressIndex(currentStepIndex);
      setProgressPercent(PROGRESS_STEPS[currentStepIndex].percent);
      
    }, 500);

    return () => clearInterval(interval);
  }, [report?.status]);

  useEffect(() => {
    if (loading || authLoading) {
      const interval = setInterval(() => setFastLoadStep(p => (p < 3 ? p + 1 : p)), 400);
      return () => clearInterval(interval);
    }
  }, [loading, authLoading]);
  const fastTexts = ["Connexion sécurisée...", "Extraction du dossier...", "Déchiffrement...", "Ouverture..."];
  const fastPercents = [25, 50, 80, 100];

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "Le message est copié dans le presse-papier." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    
    const handleAfterPrint = () => {
      setIsGeneratingPdf(false);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    
    // Delay to let React update UI before print dialog opens
    requestAnimationFrame(() => {
      window.print();
    });
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] relative overflow-hidden p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-sm w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100 flex items-center justify-center relative">
          <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl animate-ping" />
          <ScanSearch className="w-10 h-10 text-indigo-600 animate-pulse" />
        </div>
        <div className="text-center space-y-3 h-16">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 transition-all duration-300">
            {fastTexts[fastLoadStep]}
          </h2>
          <p className="text-slate-500 font-medium">Récupération de l'expertise La Truffe.</p>
        </div>
        <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden shadow-inner">
          <div className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out relative" style={{ width: `${fastPercents[fastLoadStep]}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );

  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Effet de brume en fond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
          
          {/* En-tête avec Logo animé */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-white rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100">
            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl animate-ping" />
            <ScanSearch className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit en cours</h2>
            <p className="text-slate-500 font-medium text-lg">La Truffe analyse ce dossier en profondeur...</p>
          </div>

          {/* Carte de progression */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-slate-100">
            
            {/* Barre de pourcentage */}
            <div className="mb-8 relative">
              <div className="flex justify-between text-xs font-black text-indigo-600 mb-3 px-1">
                <span className="uppercase tracking-widest">Progression globale</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out relative" 
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>

            {/* Timeline verticale des étapes */}
            <div className="space-y-6 relative ml-2">
              {/* Ligne de connexion verticale */}
              <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-100 z-0" />
              
              {PROGRESS_STEPS.map((step, index) => {
                const isCompleted = index < progressIndex;
                const isCurrent = index === progressIndex;
                
                return (
                  <div key={index} className={`flex items-center gap-5 relative z-10 transition-all duration-500 ${isCurrent ? "scale-105 origin-left" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                      isCompleted ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : 
                      isCurrent ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 animate-pulse ring-4 ring-indigo-50" : 
                      "bg-white text-slate-300 border-2 border-slate-100"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors duration-500 ${
                      isCompleted ? "text-slate-700" : 
                      isCurrent ? "text-indigo-700" : 
                      "text-slate-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
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

      <main id="report-content" className="flex-1 container mx-auto px-4 py-10 max-w-5xl space-y-10">
        
        {/* --- 1. HERO SECTION --- */}
        <div className="pdf-section flex flex-col md:flex-row items-center md:items-start gap-8 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-[2rem] overflow-hidden shadow-inner border-4 border-slate-50 relative group">
            <img src={imageCover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Vehicule" />
            <div className="absolute top-3 left-3">
               <Badge className="bg-black/60 backdrop-blur-md text-white border-0 shadow-sm">{isSingleAudit ? 'Dossier Premium' : 'Analyse Marché'}</Badge>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-2 text-center md:text-left w-full">
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
                <a href={report.lien_annonce} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ml-0 md:ml-auto">
                  <ExternalLink className="w-4 h-4" /> Voir l'annonce
                </a>
              )}
            </div>
          </div>
        </div>

        {/* --- 2. LES CHIFFRES (SCORE & PRIX) --- */}
        <div className="pdf-section grid md:grid-cols-3 gap-6">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl bg-white overflow-hidden flex flex-col justify-center p-6 relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
            <CardContent className="text-center p-0 pt-4">
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-6 font-black text-slate-900 text-lg uppercase tracking-tight">
                {stats.score >= 80 ? "Achat Recommandé" : stats.score >= 60 ? "Négociation Requise" : "Vigilance Absolue"}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white overflow-hidden p-8 relative">
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

        {/* --- 3. VERDICT IA --- */}
        <div className="pdf-section bg-white border border-indigo-100/60 rounded-[2rem] p-6 md:p-8 shadow-lg shadow-indigo-100/20 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shrink-0 relative z-10">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1 space-y-4 relative z-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Verdict de l'Expert</h2>
            <p className="text-lg font-medium text-slate-700 leading-relaxed">
              {report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse du profil en cours d'écriture..."}
            </p>
            {signaux.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-indigo-50">
                {signaux.map((s: any, i: number) => (
                  <Badge key={i} className={`font-bold text-[10px] px-3 py-1 border-0 ${s.type === 'destructive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {s.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- 4. BILAN DE SANTÉ (ENTRETIENS VS DEVIS) en 50/50 --- */}
        {isSingleAudit && (
          <div className="pdf-section grid md:grid-cols-2 gap-8 pt-4">
            
            {/* COLONNE GAUCHE : ENTRETIENS RÉCENTS */}
            {(() => {
              const entretiens = singleAuditData?.entretiens_recents || (report?.market_data?.entretiens_recents);
              return (
                <div className="space-y-4 break-inside-avoid">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500 w-6 h-6" /> Points Sécurisés
                  </h3>
                  <Card className="rounded-[2rem] border-emerald-200 shadow-lg bg-emerald-50/30 h-full">
                    <div className="bg-emerald-50/80 px-6 py-4 border-b border-emerald-100">
                      <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Travaux & Entretiens validés</p>
                    </div>
                    {Array.isArray(entretiens) && entretiens.length > 0 ? (
                      <div className="divide-y divide-emerald-100/50 p-2">
                        {entretiens.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-emerald-950 font-bold text-sm leading-tight">{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-emerald-700/60 font-medium text-sm">
                        Aucun entretien majeur spécifié dans l'annonce.
                      </div>
                    )}
                  </Card>
                </div>
              );
            })()}

            {/* COLONNE DROITE : FACTURE PRÉVISIONNELLE */}
            {(() => {
              let devisItems: any[] = [];
              try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
              const total = devisItems.filter(d => !d.deja_fait).reduce((s, d) => s + (d.cout_euros || 0), 0);
              
              return (
                <div className="space-y-4 break-inside-avoid">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="text-rose-500 w-6 h-6" /> Frais à Prévoir
                  </h3>
                  <Card className="rounded-[2rem] border-rose-100 shadow-lg bg-white h-full flex flex-col">
                    <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100">
                      <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Fiabilisation estimée</p>
                    </div>
                    <div className="divide-y divide-dashed divide-slate-100 flex-1 p-2">
                      {devisItems.length > 0 ? devisItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3">
                          <span className={`font-bold text-sm pr-4 leading-tight ${item.deja_fait ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                            {item.piece}
                          </span>
                          {item.deja_fait ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] uppercase tracking-widest px-2 py-0.5 shrink-0 whitespace-nowrap">Déjà fait</Badge>
                          ) : (
                            <span className="text-slate-900 font-black whitespace-nowrap">+{safeNum(item.cout_euros)} €</span>
                          )}
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-400 font-medium text-sm h-full flex items-center justify-center">
                          Aucun frais immédiat détecté.
                        </div>
                      )}
                    </div>
                    <div className="bg-rose-50 px-6 py-5 flex justify-between items-center border-t-2 border-rose-200">
                      <span className="font-black text-rose-900 uppercase text-xs tracking-widest">Impact sur le prix</span>
                      <span className="text-2xl font-black text-rose-600 tracking-tighter">{safeNum(total)} €</span>
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* --- 5. LE PLAYBOOK (ÉTAPE PAR ÉTAPE) --- */}
        <div className="pdf-section space-y-8 pt-8 border-t border-slate-200">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Target className="w-7 h-7 text-indigo-500" /> Playbook de Négociation
            </h3>
            <p className="text-slate-500 font-medium mt-1">Votre stratégie pas-à-pas pour sécuriser cet achat au meilleur prix.</p>
          </div>
          
          <div className="grid gap-6">
            {negotiationPoints.map((nego: any, i: number) => {
              const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
              const smsText = smsMatch ? smsMatch[1].trim() : null;
              const isSMSBlock = !!smsText;
              
              return (
                <Card key={i} className="border-slate-100 shadow-md rounded-[2rem] overflow-hidden break-inside-avoid bg-white">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-slate-50 p-6 md:p-8 flex md:flex-col items-center justify-center md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 text-indigo-600 flex items-center justify-center font-black text-xl mb-0 md:mb-2 mr-4 md:mr-0">
                        {i+1}
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest hidden md:block text-center">Étape</span>
                      <span className="font-black text-slate-700 md:hidden">{nego.titre}</span>
                    </div>
                    <div className="p-6 md:p-8 flex-1">
                      <h4 className="font-black text-xl text-slate-900 mb-4 hidden md:block">{nego.titre}</h4>
                      {isSMSBlock ? (
                        <div className="space-y-6">
                          {formatText(nego.desc.split(smsMatch[0])[0])}
                          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] rounded-tl-none shadow-xl relative max-w-3xl">
                            <div className="flex items-center gap-2 mb-3 text-indigo-400">
                              <MessageSquare className="w-5 h-5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Modèle de message</span>
                            </div>
                            <p className="text-base md:text-lg font-medium italic text-slate-100 leading-relaxed">"{smsText}"</p>
                            <Button onClick={() => handleCopySMS(smsText)} className="mt-6 w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md">
                              {isCopied ? <><Check className="w-4 h-4 mr-2" /> Copié</> : <><Copy className="w-4 h-4 mr-2" /> Copier le message</>}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        formatText(nego.desc)
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* --- 6. ÉQUIPEMENTS CLÉS (MODE FICHE TECHNIQUE LARGE) --- */}
        {isSingleAudit && (
          <div className="pdf-section space-y-6 pt-8 border-t border-slate-200 break-inside-avoid">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Settings2 className="w-7 h-7 text-slate-400" /> Équipements & Options détectés
            </h3>
            <Card className="rounded-[2rem] border-slate-200 shadow-md bg-white p-6 md:p-8">
              {Array.isArray(singleAuditData?.options) && singleAuditData.options.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                  {singleAuditData.options.map((opt: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <div className="mt-0.5 text-indigo-400/70 group-hover:text-indigo-600 transition-colors shrink-0">
                        {getOptionIcon(opt)}
                      </div>
                      <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors text-sm leading-snug">{opt}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic text-sm py-4">Aucun équipement spécifique ou option premium détecté dans l'annonce.</p>
              )}
            </Card>
          </div>
        )}

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

        {/* --- DISCLAIMER --- */}
        <div className="mt-16 p-6 md:p-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-4 items-start">
          <ShieldCheck className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-indigo-900 text-base mb-2">Notre mission : Vous protéger</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              La Truffe a été conçue pour vous accompagner et vous donner l'avantage lors de votre achat. Ce rapport est une aide à la décision générée par Intelligence Artificielle à partir des données fournies par le vendeur. Bien qu'il détecte la majorité des pièges, il ne remplace pas votre vigilance lors de l'essai physique du véhicule. Gardez l'œil ouvert, et bonne route !
            </p>
          </div>
        </div>

      </main>
      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
};

export default ReportView;
