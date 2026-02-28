import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Download, CheckCircle2, 
  TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Loader2, Search, History, ExternalLink,
  Brain, Calculator, FileCheck,
  Copy, Check, Snowflake, Flame, CircleDashed, Settings2, BrainCircuit, MessageSquareWarning, Zap, Cpu,
  ShieldAlert, ChevronRight, LayoutList, ScanSearch, Microscope
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';
import { ProxiedImage } from '@/components/ProxiedImage';

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

// --- COMPOSANTS UI PREMIUM ---

const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto drop-shadow-sm">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-5xl font-black ${colorClass}`}>{score}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Score Trust</span>
      </div>
    </div>
  );
};

const getOptionIcon = (opt: string) => {
  const text = opt.toLowerCase();
  if (text.includes('pompe')) return <Snowflake className="w-4 h-4 text-blue-500" />;
  if (text.includes('siège') || text.includes('chauffant')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (text.includes('jante')) return <CircleDashed className="w-4 h-4 text-slate-700" />;
  if (text.includes('auto') || text.includes('caméra')) return <Cpu className="w-4 h-4 text-purple-500" />;
  return <Settings2 className="w-4 h-4 text-slate-500" />;
};

const getTagStyle = (tag: string) => {
  switch (tag) {
    case 'FRAUDE': return 'bg-rose-600 text-white border-rose-600 animate-pulse';
    case 'FLIP': return 'bg-emerald-500 text-white border-emerald-500';
    case 'COLLECTION': return 'bg-indigo-600 text-white border-indigo-600';
    case 'DANGER': return 'bg-black text-white border-black';
    default: return 'bg-slate-200 text-slate-700';
  }
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

// Étapes du chargement "Expertise Digitale"
const PROGRESS_STEPS = [
  { time: 1000, label: "Collecte des données de l'annonce...", icon: ScanSearch },
  { time: 3500, label: "Analyse des spécifications techniques...", icon: Microscope },
  { time: 7000, label: "Consultation du Cerveau Hybride V12...", icon: Brain },
  { time: 10000, label: "Calcul de la cote de marché réelle...", icon: Calculator },
  { time: 13000, label: "Finalisation de votre rapport d'expertise...", icon: FileCheck },
];

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

  const [sortField, setSortField] = useState<'score' | 'prix' | 'kilometrage'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleSort = (field: 'prix' | 'kilometrage') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchReport = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/client'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchReport(); }, [id, navigate]);

  useEffect(() => {
    if (!report || report.status === 'completed') return;
    const channel = supabase.channel(`report_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` }, 
      (payload) => {
        if (payload.new.status === 'completed') fetchReport();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [report, id]);

  useEffect(() => {
    if (report?.status !== 'in_progress' && report?.status !== 'pending') return;
    const startTime = Date.now();
    let animationFrameId: number;
    let timeouts: NodeJS.Timeout[] = [];

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const targetPercent = Math.min((elapsed / 15000) * 100, 95);
      setProgressPercent(targetPercent);
      if (targetPercent < 95) animationFrameId = requestAnimationFrame(updateProgress);
    };
    animationFrameId = requestAnimationFrame(updateProgress);
    PROGRESS_STEPS.forEach((step, index) => { timeouts.push(setTimeout(() => setProgressIndex(index), step.time)); });

    return () => { cancelAnimationFrame(animationFrameId); timeouts.forEach(clearTimeout); };
  }, [report?.status]);

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "L'argument est prêt à être envoyé." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    toast({ title: "Génération PDF...", description: "Veuillez patienter." });
    await new Promise(r => setTimeout(r, 800));
    const success = await generatePDF('report-content', `Rapport_Expertise_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "Rapport téléchargé.", className: "bg-emerald-600 text-white" });
  };

  const vehiclesData = useMemo(() => report?.vehicles_data || [], [report]);
  const isSingleAudit = useMemo(() => report?.market_data?.type === 'single_audit', [report]);
  const singleAuditData = useMemo(() => isSingleAudit ? report?.market_data : null, [report, isSingleAudit]);
  
  const stats = useMemo(() => {
    if (!report) return null;
    if (isSingleAudit) {
      const pAffiche = Number(report.prix_affiche || 0);
      const pCible = Number(report.prix_truffe || report.prix_estime || pAffiche);
      return { 
        prixAffiche: pAffiche, 
        prixCible: pCible, 
        economy: pAffiche - pCible,
        score: singleAuditData?.score || 50, 
        isGoodDeal: pAffiche <= pCible,
        totalVehicules: 1
      };
    }
    const vehiculeCible = vehiclesData.length > 0 ? [...vehiclesData].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0))[0] : null;
    const pMarche = Number(report.prix_moyen || 0);
    const pCible = vehiculeCible ? Number(vehiculeCible.prix || 0) : pMarche;
    return { 
      prixAffiche: pMarche, 
      prixCible: pCible, 
      economy: pMarche - pCible, 
      score: vehiculeCible?.dealScore || 50, 
      isGoodDeal: (pMarche - pCible) > 0,
      totalVehicules: report.total_vehicules || vehiclesData.length
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
    if (allTags.length > 0) {
      return allTags.slice(0, 8).map((tag: string) => ({
        label: tag,
        type: (tag.includes('⚠️') || tag.includes('💀') || tag.includes('🚨') || tag.includes('💥')) ? 'destructive' : 'success'
      }));
    }
    return [];
  }, [singleAuditData]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
      <p className="font-bold text-slate-600 tracking-tight">Préparation de l'expertise...</p>
    </div>
  );
  if (!report || !stats) return null;

  // --- VUE CHARGEMENT (PREMIUM & CLEAN) ---
  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
            <BrainCircuit className="w-12 h-12 text-indigo-600 relative z-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expertise en cours</h2>
            <p className="text-slate-500 font-medium italic">Le Cerveau Hybride analyse votre {report.marque}...</p>
          </div>

          <div className="space-y-4 bg-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100 border border-indigo-50">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                <span>Progression</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
            </div>

            <div className="pt-6 space-y-5">
              {PROGRESS_STEPS.map((step, index) => {
                const isActive = index === progressIndex;
                const isPast = index < progressIndex;
                return (
                  <div key={index} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? "scale-105 text-indigo-600" : isPast ? "text-emerald-500 opacity-60" : "text-slate-300 opacity-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-indigo-100" : "bg-slate-50"}`}>
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-bold ${isActive ? "tracking-wide" : ""}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VUE FINALE ---
  const imageCover = isSingleAudit ? (singleAuditData?.image_url || `data:image/png;base64,${singleAuditData?.screenshot}`) : vehiclesData[0]?.image;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="font-black text-2xl tracking-tighter text-slate-900 flex items-center gap-2">
            La Truffe <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] h-5 font-black uppercase tracking-widest">Expertise V12</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')} className="font-bold text-slate-500 hover:text-slate-900 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-slate-200">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Télécharger PDF
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-12 max-w-6xl space-y-12">
        
        {/* --- HEADER PROFILE --- */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          <div className="w-56 h-56 lg:w-72 lg:h-72 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group hover:rotate-1 transition-transform duration-700 shrink-0 bg-slate-50">
            <img src={imageCover} alt={report.modele} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div className="text-center lg:text-left flex-1 py-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <Badge className="bg-indigo-600 text-white font-black px-4 py-1.5 uppercase tracking-widest text-[10px] border-0 rounded-lg">
                {isSingleAudit ? 'Expertise Unique' : 'Analyse de Marché'}
              </Badge>
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tight">
                <History className="w-4 h-4" /> Rapport ID: {report.id.slice(0,8).toUpperCase()}
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight mb-8">
              {report.marque} <span className="text-indigo-600">{report.modele}</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm font-black text-slate-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> {report.annee}
              </div>
              <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm font-black text-slate-700 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-500" /> {safeNum(report.kilometrage)} km
              </div>
              <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm font-black text-slate-700 flex items-center gap-2 capitalize">
                <Fuel className="w-5 h-5 text-amber-500" /> {report.carburant || 'Essence'}
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID RÉSULTATS --- */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          <Card className="rounded-[3rem] border-0 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden flex flex-col justify-center py-12 relative">
            <div className={`absolute top-0 left-0 w-full h-2 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
            <CardContent className="p-6 text-center">
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-8 font-black text-slate-900 text-xl uppercase tracking-tighter">
                {stats.score >= 80 ? "Opportunité Validée" : stats.score >= 60 ? "Offre à Discuter" : "Prudence Recommandée"}
              </p>
              <p className="text-slate-400 text-sm font-bold mt-2">Calculé sur {stats.totalVehicules} annonces actives</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-[3rem] border-0 shadow-2xl shadow-slate-200/50 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-12 opacity-5"><Euro className="w-48 h-48" /></div>
            <CardHeader className="p-10 pb-4">
              <Badge className="w-fit bg-indigo-500 border-0 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md">Estimation du Marché</Badge>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-10 border-b border-white/10">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">{isSingleAudit ? 'Prix Affiché' : 'Moyenne Globale'}</p>
                  <p className={`text-4xl font-black ${stats.economy > 0 ? 'text-white/30 line-through decoration-rose-500 decoration-4' : 'text-white'}`}>
                    {safeNum(stats.prixAffiche)} €
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2 flex items-center md:justify-end gap-1.5">
                    <CheckCircle2 className="w-4 h-4"/> Cote La Truffe
                  </p>
                  <p className="text-7xl font-black text-white tracking-tighter">{safeNum(stats.prixCible)} €</p>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingDown className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Potentiel de Négociation</p>
                    <p className="text-4xl font-black text-emerald-400">-{safeNum(Math.abs(stats.economy))} €</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-xl font-black text-sm">
                  {Math.round((stats.economy / stats.prixAffiche) * 100)}% d'économie
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- SYNTHÈSE IA --- */}
        <div className="bg-indigo-600 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><BrainCircuit className="w-48 h-48 text-white" /></div>
          <div className="relative z-10 space-y-8 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-black flex items-center gap-4">
              <span className="p-4 bg-white/10 rounded-2xl border border-white/20"><Brain className="w-10 h-10" /></span>
              Verdict de l'IA Agentique
            </h2>
            <p className="text-xl md:text-2xl font-medium leading-relaxed opacity-95 italic font-serif">
              "{report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse en cours..."}"
            </p>
            <div className="flex flex-wrap gap-2 pt-4">
              {signaux.map((s: any, i: number) => (
                <Badge key={i} className={`font-black text-[11px] px-4 py-2 border-0 rounded-lg ${s.type === 'destructive' ? 'bg-rose-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* --- PLAYBOOK SMS --- */}
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <MessageSquareWarning className="w-8 h-8 text-indigo-600" /> Playbook Vendeur
              </h3>
              <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] px-3 py-1">Stratégie</Badge>
            </div>

            <div className="space-y-14 relative">
              <div className="absolute left-6 top-2 bottom-2 w-1 bg-slate-100 rounded-full"></div>
              {negotiationPoints.map((nego: any, i: number) => {
                const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                const smsText = smsMatch ? smsMatch[1].trim() : null;
                
                return (
                  <div key={i} className="relative pl-16">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 flex items-center justify-center font-black text-lg shadow-sm z-10">
                      {i + 1}
                    </div>
                    <h4 className="font-black text-2xl text-slate-900 mb-4 tracking-tight">{nego.titre}</h4>
                    
                    {smsText ? (
                      <div className="space-y-8">
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">{nego.desc.split(smsMatch[0])[0]}</p>
                        <div className="relative group max-w-lg">
                          <div className="bg-[#007AFF] text-white p-8 rounded-[2.5rem] rounded-bl-lg shadow-2xl relative transition-transform hover:scale-[1.02]">
                            <p className="text-lg font-medium leading-relaxed italic">"{smsText}"</p>
                          </div>
                          <Button 
                            onClick={() => handleCopySMS(smsText)}
                            className="absolute -bottom-5 -right-5 w-16 h-16 rounded-2xl bg-slate-900 text-white shadow-2xl border-4 border-white hover:bg-slate-800 transition-all active:scale-90 p-0"
                          >
                            {isCopied ? <Check className="w-7 h-7 text-emerald-400" /> : <Copy className="w-7 h-7" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 font-medium text-lg leading-relaxed bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        {nego.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- DEVIS & OPTIONS (Sidebar) --- */}
          <div className="space-y-12">
            {/* DEVIS TABLE */}
            {isSingleAudit && (() => {
              let devisItems: { piece: string; cout_euros: number }[] = [];
              try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
              if (!Array.isArray(devisItems) || devisItems.length === 0) return null;
              const total = devisItems.reduce((s, d) => s + (d.cout_euros || 0), 0);
              return (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <ShieldAlert className="w-7 h-7 text-rose-500" /> Malus Maintenance
                  </h3>
                  <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-5">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frais immédiats à prévoir</p>
                    </CardHeader>
                    <div className="divide-y divide-slate-50">
                      {devisItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-8 py-5 hover:bg-slate-50 transition-colors">
                          <span className="text-slate-600 font-bold text-sm">{item.piece}</span>
                          <span className="text-slate-900 font-black text-sm">+{safeNum(item.cout_euros)} €</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-50 px-8 py-8 flex justify-between items-center border-t-4 border-rose-500">
                      <span className="font-black text-rose-900 uppercase text-xs tracking-widest">Total Malus</span>
                      <span className="text-4xl font-black text-rose-600 tracking-tighter">{safeNum(total)} €</span>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* OPTIONS */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Cpu className="w-7 h-7 text-indigo-600" /> Équipements
              </h3>
              <div className="grid gap-4">
                {singleAuditData?.options?.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {getOptionIcon(opt)}
                    </div>
                    <span className="font-black text-slate-700 text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- RADAR SNIPER (Marché uniquement) --- */}
        {!isSingleAudit && (
          <div className="pt-20 border-t border-slate-200 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Radar Sniper</h2>
                <p className="text-slate-500 font-bold text-lg mt-2">Votre positionnement face à {stats.totalVehicules} opportunités détectées.</p>
              </div>
              <Badge className="bg-slate-900 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest border-0">Algo V12 Intelligence</Badge>
            </div>
            <Card className="rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border-0 overflow-hidden h-[600px] bg-slate-950 p-8">
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
