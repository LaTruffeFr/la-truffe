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
  ArrowLeft, Download, Share2, CheckCircle2, 
  AlertTriangle, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Loader2, Search, MapPin, Trophy, ListFilter, ExternalLink, Sparkles,
  ArrowUpDown, ArrowUp, ArrowDown, Terminal, Database, Brain, Calculator, FileCheck,
  Copy, Check, Snowflake, Flame, CircleDashed, Settings2, BrainCircuit, MessageSquareWarning, Zap, Cpu
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

// --- COMPOSANTS UI DE LA NOUVELLE VUE ---
const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto drop-shadow-sm">
      <svg className="transform -rotate-90 w-36 h-36">
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mt-1">
        <span className={`text-4xl font-black ${colorClass}`}>{score}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ 100</span>
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
    case 'FRAUDE': return 'bg-red-600 text-white border-red-600 animate-pulse';
    case 'FLIP': return 'bg-emerald-500 text-white border-emerald-500';
    case 'COLLECTION': return 'bg-purple-600 text-white border-purple-600';
    case 'DANGER': return 'bg-black text-white border-black';
    default: return 'bg-slate-200 text-slate-700';
  }
};

// --- CALCUL LOG (Pour le Market Audit) ---
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

// Les étapes du mode "Hackeur"
const PROGRESS_STEPS = [
  { time: 1000, label: "Connexion à l'annonce et aspiration...", icon: Terminal },
  { time: 3000, label: "Extraction des données et photos...", icon: Database },
  { time: 6000, label: "Analyse IA du véhicule...", icon: Brain },
  { time: 9000, label: "Passage au crible Algo V11...", icon: Calculator },
  { time: 12000, label: "Rédaction de l'avis et formatage...", icon: FileCheck },
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

  // Mode Hackeur
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Market Audit States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'score' | 'prix' | 'kilometrage'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // FONCTION DE TRI RAJOUTÉE ICI
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
    if (error || !data) { navigate('/client-dashboard'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchReport(); }, [id, navigate]);

  // Écoute Supabase Realtime (Si le rapport est en cours de création)
  useEffect(() => {
    if (!report || report.status === 'completed') return;
    const channel = supabase.channel(`report_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` }, 
      (payload) => {
        if (payload.new.status === 'completed') fetchReport();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [report, id]);

  // Animation Jauge "Hackeur"
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
    toast({ title: "Copié !", description: "Le message est prêt à être envoyé au vendeur." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    toast({ title: "Génération...", description: "Création du rapport PDF en cours." });
    await new Promise(r => setTimeout(r, 500));
    const success = await generatePDF('report-content', `Rapport_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "PDF généré.", className: "bg-green-600 text-white" });
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
        totalVehicules: 1 // AJOUT ICI
      };
    }
    // Logic Market Audit
    const vehiculeCible = vehiclesData.length > 0 ? [...vehiclesData].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0))[0] : null;
    const pMarche = Number(report.prix_moyen || 0);
    const pCible = vehiculeCible ? Number(vehiculeCible.prix || 0) : pMarche;
    return { 
      prixAffiche: pMarche, 
      prixCible: pCible, 
      economy: pMarche - pCible, 
      score: vehiculeCible?.dealScore || 50, 
      isGoodDeal: (pMarche - pCible) > 0,
      totalVehicules: report.total_vehicules || vehiclesData.length // AJOUT ICI
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

  // Use algorithm tags if available, fallback to points_forts/faibles
  const allTags = useMemo(() => singleAuditData?.tags || [], [singleAuditData]);
  const signaux = useMemo(() => {
    if (allTags.length > 0) {
      return allTags.slice(0, 8).map((tag: string) => ({
        label: tag,
        type: (tag.includes('⚠️') || tag.includes('💀') || tag.includes('🚨') || tag.includes('💥') || tag.includes('🔧')) ? 'destructive' : 'success'
      }));
    }
    let s: any[] = [];
    if (singleAuditData?.points_forts) singleAuditData.points_forts.forEach((pt: string) => s.push({ label: pt, type: 'success' }));
    if (singleAuditData?.points_faibles) singleAuditData.points_faibles.forEach((pt: string) => s.push({ label: pt, type: 'destructive' }));
    return s.slice(0, 8);
  }, [singleAuditData, allTags]);

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!report || !stats) return null;

  // ==========================================
  // VUE 1 : CHARGEMENT HACKEUR
  // ==========================================
  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg border-primary/20 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-primary font-mono text-lg">
              <Terminal className="h-5 w-5 animate-pulse" /> Initialisation du Cerveau Hybride...
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400"><span>Progression</span><span>{Math.round(progressPercent)}%</span></div>
              <Progress value={progressPercent} className="h-2 bg-slate-800 [&>div]:bg-primary" />
            </div>
            <div className="space-y-4 font-mono text-sm">
              {PROGRESS_STEPS.map((step, index) => {
                const isActive = index === progressIndex;
                const isPast = index < progressIndex;
                const Icon = step.icon;
                return (
                  <div key={index} className={`flex items-center gap-3 transition-all duration-500 ${isActive ? "text-primary scale-105" : isPast ? "text-emerald-500 opacity-70" : "text-slate-600 opacity-30"}`}>
                    <div className="w-6 flex justify-center">{isPast ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}</div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : RAPPORT TERMINÉ (NOUVEAU DESIGN)
  // ==========================================
  const imageCover = isSingleAudit ? (singleAuditData?.image_url || `data:image/png;base64,${singleAuditData?.screenshot}`) : vehiclesData[0]?.image;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
            La Truffe <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-normal">Audit Certifié</Badge>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/client-dashboard')}><ArrowLeft className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Retour</span></Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="bg-slate-900 hover:bg-slate-800 text-white">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 sm:mr-2" />} <span className="hidden sm:inline">Télécharger PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* --- CAR PROFILE BANNER --- */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg border-4 border-white shrink-0 bg-slate-100">
            <img src={imageCover} alt={report.modele} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{isSingleAudit ? 'Audit URL' : 'Audit Marché'}</Badge>
              <span className="text-sm text-slate-500 font-mono">ID: {report.id.slice(0,8).toUpperCase()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{report.marque} {report.modele}</h1>
            <div className="text-slate-500 font-medium mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              {report.annee && <span>Année {report.annee} •</span>}
              {report.kilometrage && <span>{safeNum(report.kilometrage)} km •</span>}
              {report.carburant && <span>{report.carburant}</span>}
            </div>
            {isSingleAudit && report.lien_annonce && (
               <Button variant="link" className="mt-2 h-auto p-0 text-primary" onClick={() => window.open(report.lien_annonce, '_blank')}>
                 Voir l'annonce d'origine <ExternalLink className="w-3 h-3 ml-1" />
               </Button>
            )}
          </div>
        </div>

        {/* --- HERO SECTION : LES 3 GROSSES CARTES GRID --- */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* CARTE 1 : SCORE */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col justify-center py-6 relative">
            <div className={`absolute top-0 left-0 w-full h-1 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}></div>
            <CardContent className="p-6 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-6 tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Score de Confiance
              </p>
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-6 text-sm font-medium text-slate-500">
                {stats.score >= 80 ? "Excellent positionnement" : stats.score >= 60 ? "Correct, mais négociable" : "Achat déconseillé en l'état"}
              </p>
            </CardContent>
          </Card>

          {/* CARTE 2 : PRIX & ÉCONOMIE */}
          <Card className="border-slate-200 shadow-sm bg-white relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute top-0 left-0 w-full h-1 ${stats.isGoodDeal ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
            <CardHeader className="pb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyse de Valeur</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{isSingleAudit ? 'Prix Vendeur' : 'Cote Moyenne'}</p>
                  <p className={`text-2xl font-semibold ${stats.economy > 0 && isSingleAudit ? 'text-slate-400 line-through decoration-red-400/50' : 'text-slate-700'}`}>
                    {safeNum(stats.prixAffiche)} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 mb-1 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-4 h-4"/> Vraie Cote
                  </p>
                  <p className="text-4xl font-black text-slate-900">{safeNum(stats.prixCible)} €</p>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 flex items-center justify-between border shadow-inner ${stats.economy >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 text-white p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-emerald-900">
                    {stats.economy >= 0 ? 'Marge de négo.' : 'Économie estimée'}
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-600">
                  +{safeNum(Math.abs(stats.economy))} €
                </span>
              </div>
            </CardContent>
          </Card>

          {/* CARTE 3 : BADGES / SIGNAUX */}
          <Card className="border-slate-200 shadow-sm bg-white">
             <CardHeader className="pb-4 border-b border-slate-50">
               <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-4 h-4 text-primary" /> Signaux détectés (V11)
               </CardTitle>
             </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {signaux.length > 0 ? signaux.map((tag: any, i: number) => {
                    const isNegative = tag.type === 'destructive';
                    const isGold = tag.label.includes('🏆') || tag.label.includes('✨') || tag.label.includes('🦄');
                    let badgeColor = isNegative 
                      ? "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100" 
                      : isGold 
                        ? "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100";
                    
                    return (
                      <Badge key={i} className={`text-xs font-bold px-3 py-1.5 border ${badgeColor}`}>
                        {tag.label}
                      </Badge>
                    );
                  }) : (
                    <p className="text-sm text-slate-500 italic">Aucun signal détecté.</p>
                  )}
                </div>
              </CardContent>
          </Card>
        </div>

        {/* --- SYNTHÈSE DE L'IA (ALERT BLOC) --- */}
        <Alert className="bg-primary/5 border-primary/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
          <div className="bg-white p-4 rounded-full shadow-sm border border-primary/10 shrink-0">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <div>
            <AlertTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              L'avis du Cerveau Hybride
            </AlertTitle>
            <AlertDescription className="text-slate-700 leading-relaxed text-base">
              {report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "L'analyse est en cours d'écriture..."}
            </AlertDescription>
          </div>
        </Alert>

        {/* --- PLAYBOOK & OPTIONS --- */}
        <div className="grid md:grid-cols-3 gap-8 pb-12">
          
          {/* PLAYBOOK DE NÉGOCIATION (TIMELINE) */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareWarning className="w-6 h-6 text-primary" /> Votre Playbook de Négociation
            </h3>
            
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8">
                <div className="border-l-2 border-slate-100 ml-4 pl-8 py-2 relative space-y-12">
                  
                  {negotiationPoints.length > 0 ? negotiationPoints.map((nego: any, i: number) => {
                    // Detect SMS between « » or " "
                    const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                    const beforeSms = smsMatch ? nego.desc.slice(0, nego.desc.indexOf(smsMatch[0])) : null;
                    const smsText = smsMatch ? smsMatch[1].trim() : null;
                    const hasSMS = !!smsText;

                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center font-bold text-slate-500 shadow-sm z-10">
                          {i+1}
                        </div>
                        
                        <h4 className="font-bold text-lg text-slate-900 mb-2">{nego.titre}</h4>
                        
                        {hasSMS ? (
                          <div className="space-y-4">
                            <p className="text-slate-600 leading-relaxed">{beforeSms}</p>
                            <div className="relative w-full md:w-5/6">
                              <div className="bg-blue-600 text-white p-5 rounded-2xl rounded-bl-sm shadow-md pr-12 relative">
                                <p className="text-[15px] leading-relaxed italic">"{smsText}"</p>
                              </div>
                              <Button 
                                onClick={() => handleCopySMS(smsText!)}
                                className="absolute -bottom-4 right-4 shadow-lg rounded-full w-12 h-12 p-0 bg-slate-900 hover:bg-slate-800 transition-transform hover:scale-105"
                              >
                                {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {nego.desc}
                          </p>
                        )}
                      </div>
                    )
                  }) : (
                    <p className="text-slate-500 italic">Aucun argument généré pour l'instant.</p>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>

          {/* OPTIONS EXTRAITES */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-purple-500" /> Équipements
            </h3>
            
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-6">L'IA a lu la description et identifié ces options qui justifient (en partie) le prix :</p>
                <div className="flex flex-col gap-3">
                  {singleAuditData?.options?.length > 0 ? singleAuditData.options.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="bg-white p-2 rounded-md shadow-sm">
                        {getOptionIcon(opt)}
                      </div>
                      <span className="font-medium text-slate-700 text-sm">{opt}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 italic">Options standards ou non précisées.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ====================================================================
            POUR LE MARKET AUDIT UNIQUEMENT : GRAPHIQUE ET LISTE DES VÉHICULES 
            ==================================================================== */}
        {!isSingleAudit && vehiclesData.length > 0 && (
          <>
            <div className="mb-8 pdf-section border-t border-slate-200 pt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><TrendingDown className="w-6 h-6 text-primary" /> Le Radar Sniper</h2>
              <Card className="shadow-lg border-slate-200 overflow-hidden h-[400px] md:h-[500px]">
                <CardContent className="p-2 md:p-4 h-full">
                  <SniperChart data={vehiclesData} trendLine={calculateLogTrendLine(vehiclesData)} onVehicleClick={setSelectedVehicle} />
                </CardContent>
              </Card>
            </div>

            <div className="mb-12 pdf-section">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Search className="w-8 h-8 text-primary" /> 
                Base de données ({stats.totalVehicules} annonces)
              </h2>
              <Card className="overflow-hidden border-slate-200 shadow-xl bg-white">
                <div className="max-h-[800px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-slate-100 sticky top-0 z-10 h-14">
                      <TableRow>
                        <TableHead className="w-[180px] pl-6 font-bold text-slate-700">Photo</TableHead>
                        <TableHead className="font-bold text-slate-700">Véhicule</TableHead>
                        <TableHead className="font-bold text-slate-700 cursor-pointer hover:text-primary" onClick={() => toggleSort('prix')}>
                          Prix {sortField === 'prix' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />) : <ArrowUpDown className="w-4 h-4 inline text-slate-400" />}
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 cursor-pointer hover:text-primary" onClick={() => toggleSort('kilometrage')}>
                          Km {sortField === 'kilometrage' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />) : <ArrowUpDown className="w-4 h-4 inline text-slate-400" />}
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">Score</TableHead>
                        <TableHead className="text-right pr-6 font-bold text-slate-700">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiclesData.sort((a: any, b: any) => {
                          if (sortField === 'score') return (b.dealScore || 0) - (a.dealScore || 0);
                          const valA = sortField === 'prix' ? a.prix : a.kilometrage;
                          const valB = sortField === 'prix' ? b.prix : b.kilometrage;
                          return sortDirection === 'asc' ? valA - valB : valB - valA;
                        }).map((vehicle: any, i: number) => {
                        
                        const tags = vehicle.tags || []; 
                        const isSuspicious = tags.includes('FRAUDE') || tags.includes('DANGER');

                        return (
                          <TableRow key={i} className={`transition-colors border-b border-slate-100 ${isSuspicious ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-blue-50/50'}`}>
                            <TableCell className="pl-6 py-4">
                              <div className="w-32 h-20 bg-slate-200 rounded-lg overflow-hidden relative group">
                                <ProxiedImage src={vehicle.image} brand={report.marque} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="v" />
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="font-bold text-slate-900 line-clamp-1">{vehicle.titre}</div>
                              <div className="text-sm text-slate-500 mb-1">{vehicle.annee} • {vehicle.localisation || "France"}</div>
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag: string, idx: number) => (
                                  <Badge key={idx} className={`text-[10px] px-1.5 py-0 font-bold ${getTagStyle(tag)}`}>{tag}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 font-bold text-lg text-slate-900 whitespace-nowrap">{safeNum(vehicle.prix)} €</TableCell>
                            <TableCell className="py-4 text-slate-700 whitespace-nowrap">{safeNum(vehicle.kilometrage)} km</TableCell>
                            <TableCell className="py-4">
                              <Badge className={vehicle.dealScore > 80 ? (isSuspicious ? "bg-red-600" : "bg-green-600") : "bg-slate-500"}>
                                {vehicle.dealScore || 50}/100
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4">
                              <Button size="sm" variant={isSuspicious ? "destructive" : "default"} onClick={() => window.open(vehicle.lien, '_blank')}>Voir</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </>
        )}

      </main>
      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
};

export default ReportView;