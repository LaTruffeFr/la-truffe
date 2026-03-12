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
  Flame, CircleDashed, Target, ExternalLink, MessageSquare, Flag, Share2, Star
} from "lucide-react";
import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';
import ReportAdModal from '@/components/reporting/ReportAdModal';
import { SmartOptionsDisplay } from '@/components/SmartOptionsDisplay';
import { StickyCtaBanner } from '@/components/StickyCtaBanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const colorClass =
    score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const strokeColor =
    score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  // Semi-circle geometry
  const cx = 100, cy = 100, r = 80;
  // Arc from 180° to 0° (left to right, bottom half = semi-circle top visually)
  const startAngle = Math.PI; // left
  const endAngle = 0; // right
  const arcLength = Math.PI * r; // half circumference

  const filledLength = animated ? (score / 100) * arcLength : 0;
  const gapLength = arcLength - filledLength;

  // Needle angle: 180° (left, score=0) to 0° (right, score=100)
  const needleAngle = Math.PI - (animated ? (score / 100) : 0) * Math.PI;
  const needleLen = 60;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  // Arc path (drawn from left to right over the top)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="relative w-full max-w-[220px] mx-auto">
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background track */}
        <path d={arcPath} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        {/* Colored fill */}
        <path
          d={arcPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${gapLength}`}
          className="transition-all duration-[1400ms] ease-out"
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = Math.PI - (tick / 100) * Math.PI;
          const inner = r - 10;
          const outer = r + 2;
          return (
            <line
              key={tick}
              x1={cx + inner * Math.cos(a)} y1={cy - inner * Math.sin(a)}
              x2={cx + outer * Math.cos(a)} y2={cy - outer * Math.sin(a)}
              stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round"
          className="transition-all duration-[1400ms] ease-out"
        />
        <circle cx={cx} cy={cy} r="5" fill="hsl(var(--foreground))" />
      </svg>
      {/* Score label centered at bottom of the gauge */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
        <span className={`text-4xl md:text-5xl font-black tracking-tighter ${colorClass} transition-colors duration-700`}>
          {score}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Trust Score
        </span>
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
            <p key={i} className="text-muted-foreground font-medium leading-relaxed">
              {parts.map((p, j) => 
                p.startsWith('**') && p.endsWith('**') 
                  ? <strong key={j} className="text-foreground font-black">{p.slice(2, -2)}</strong> 
                  : p
              )}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="text-muted-foreground font-medium leading-relaxed space-y-4">
      {intro && <p>{intro.trim()}</p>}
      <ul className="space-y-3">
        {bullets.map((bullet, i) => {
          const parts = bullet.split(/(\*\*.*?\*\*)/g);
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <div className="flex-1">
                {parts.map((p, j) => 
                  p.startsWith('**') && p.endsWith('**') 
                    ? <strong key={j} className="text-foreground font-black">{p.slice(2, -2)}</strong> 
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
  const { isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [fastLoadStep, setFastLoadStep] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReport = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/client'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!id || authLoading) return;
    fetchReport();
  }, [id, authLoading]);

  const isOwner = !!user && !!report && report.user_id === user.id;

  // Check if user already left a review
  useEffect(() => {
    if (!user || !id) return;
    (supabase.from('reviews' as any).select('id').eq('report_id', id).eq('user_id', user.id).maybeSingle() as any)
      .then(({ data }: any) => { if (data) setReviewSubmitted(true); });
  }, [user, id]);

  const handleSubmitReview = async () => {
    if (!user || !id || rating === 0) return;
    setIsSubmittingReview(true);
    const { error } = await (supabase.from('reviews' as any) as any).insert({
      report_id: id,
      user_id: user.id,
      rating,
      comment: reviewComment.trim() || null,
    });
    setIsSubmittingReview(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer votre avis.' });
      return;
    }
    setReviewSubmitted(true);
    setShowRatingModal(false);
    toast({ title: '⭐ Merci pour votre avis !', description: 'Votre retour nous aide à nous améliorer.' });
  };



  const isSingleAudit = useMemo(() => report?.market_data?.type === 'single_audit', [report]);
  const singleAuditData = useMemo(() => isSingleAudit ? report?.market_data : null, [report, isSingleAudit]);
  const vehiclesData = useMemo(() => report?.vehicles_data || [], [report]);

  const stats = useMemo(() => {
    if (!report) return null;
    const pAffiche = Number(report.prix_affiche || report.prix_moyen || 0);
    const pEstime = Number(report.prix_estime || pAffiche);
    const pTruffe = Number(report.prix_truffe || pEstime);
    const score = isSingleAudit ? (singleAuditData?.score || 50) : (vehiclesData[0]?.dealScore || 50);
    
    // Sous-coté = l'expert estime la voiture PLUS cher que le prix affiché
    const isUnderPriced = pEstime > pAffiche;
    // Si sous-coté, l'économie est la différence entre l'estimation expert et le prix affiché
    const economyValue = isUnderPriced ? Math.abs(pEstime - pAffiche) : 0;
    // Si surcoté, la marge de négo est la différence entre le prix affiché et le prix Truffe
    const negotiationMargin = !isUnderPriced ? Math.abs(pAffiche - pTruffe) : 0;
    
    return { 
      prixAffiche: pAffiche, prixEstime: pEstime, prixTruffe: pTruffe,
      prixCible: isUnderPriced ? pEstime : pTruffe,
      economy: isUnderPriced ? economyValue : negotiationMargin,
      isUnderPriced,
      score, isGoodDeal: isUnderPriced || pAffiche <= pTruffe,
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
    requestAnimationFrame(() => { window.print(); });
  };

  const handleShareNegotiation = async () => {
    if (!report?.share_token) {
      // Generate share token if missing
      const { error } = await supabase.from('reports').update({ share_token: crypto.randomUUID() }).eq('id', report.id);
      if (!error) await fetchReport();
    }
    const shareUrl = `${window.location.origin}/audit/${report.share_token || report.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setIsShareCopied(true);
    toast({ title: "🤝 Lien de négociation copié !", description: "Envoyez-le au vendeur par SMS pour justifier votre négociation." });
    setTimeout(() => setIsShareCopied(false), 3000);
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-sm w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-card rounded-3xl shadow-xl shadow-indigo-500/10 border border-border flex items-center justify-center relative">
          <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl animate-ping" />
          <ScanSearch className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-3 h-16">
          <h2 className="text-2xl font-black tracking-tighter text-foreground transition-all duration-300">
            {fastTexts[fastLoadStep]}
          </h2>
          <p className="text-muted-foreground font-medium">Récupération de l'expertise La Truffe.</p>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
          <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out relative" style={{ width: `${fastPercents[fastLoadStep]}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );

  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
          
          {/* En-tête avec Logo animé */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-card rounded-3xl shadow-xl shadow-indigo-500/10 border border-border">
            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl animate-ping" />
            <ScanSearch className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Audit en cours</h2>
            <p className="text-muted-foreground font-medium text-lg">La Truffe analyse ce dossier en profondeur...</p>
          </div>

          {/* Carte de progression */}
          <div className="bg-card p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 dark:shadow-none border border-border">
            
            {/* Barre de pourcentage */}
            <div className="mb-8 relative">
              <div className="flex justify-between text-xs font-black text-primary mb-3 px-1">
                <span className="uppercase tracking-widest">Progression globale</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out relative" 
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>

            {/* Timeline verticale des étapes */}
            <div className="space-y-6 relative ml-2">
              <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-border z-0" />
              
              {PROGRESS_STEPS.map((step, index) => {
                const isCompleted = index < progressIndex;
                const isCurrent = index === progressIndex;
                
                return (
                  <div key={index} className={`flex items-center gap-5 relative z-10 transition-all duration-500 ${isCurrent ? "scale-105 origin-left" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                      isCompleted ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : 
                      isCurrent ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse ring-4 ring-primary/10" : 
                      "bg-card text-muted-foreground border-2 border-border"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors duration-500 ${
                      isCompleted ? "text-foreground" : 
                      isCurrent ? "text-primary" : 
                      "text-muted-foreground"
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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      
      {/* HEADER */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 h-16 flex items-center px-4 md:px-6 print:hidden">
        <div className="container mx-auto flex items-center justify-between max-w-6xl">
          <Link to="/" className="font-black text-xl tracking-tighter text-foreground flex items-center gap-2">
            La Truffe <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-widest h-5">Certifié</Badge>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')} className="font-bold text-muted-foreground hidden sm:flex">Retour</Button>
            <Button size="sm" onClick={handleShareNegotiation} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md">
              {isShareCopied ? <Check className="w-4 h-4 sm:mr-2" /> : <Share2 className="w-4 h-4 sm:mr-2" />}
              <span className="hidden sm:inline">{isShareCopied ? 'Copié !' : 'Négocier 🤝'}</span>
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl shadow-md">
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 sm:mr-2" />} 
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-3 sm:px-4 py-6 md:py-10 max-w-5xl space-y-6 md:space-y-10">
        
        {/* --- 1. HERO SECTION --- */}
        <div className="pdf-section flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl dark:shadow-none border border-border">
          <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 shrink-0 rounded-xl md:rounded-[2rem] overflow-hidden shadow-inner border-4 border-muted relative group">
            <img src={imageCover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Vehicule" />
            <div className="absolute top-3 left-3">
               <Badge className="bg-black/60 backdrop-blur-md text-white border-0 shadow-sm">{isSingleAudit ? 'Dossier Premium' : 'Analyse Marché'}</Badge>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-2 text-center md:text-left w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest mb-3">
              <Hash className="w-3 h-3" /> Dossier {report.id.slice(0,8)} • <History className="w-3 h-3 ml-2" /> {new Date(report.created_at).toLocaleDateString()}
            </div>
            {report.market_data?.original_title ? (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-tight mb-4 md:mb-6">
                {report.market_data.original_title}
              </h1>
            ) : (
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none mb-4 md:mb-6">
                {report.marque} <span className="text-primary">{report.modele}</span>
              </h1>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
              <div className="px-4 py-2 bg-muted border border-border rounded-xl font-bold text-foreground flex items-center gap-2 shadow-sm">
                <Calendar className="w-4 h-4 text-primary" /> {report.annee}
              </div>
              <div className="px-4 py-2 bg-muted border border-border rounded-xl font-bold text-foreground flex items-center gap-2 shadow-sm">
                <Gauge className="w-4 h-4 text-emerald-500" /> {safeNum(report.kilometrage)} km
              </div>
              <div className="px-4 py-2 bg-muted border border-border rounded-xl font-bold text-foreground flex items-center gap-2 capitalize shadow-sm">
                <Fuel className="w-4 h-4 text-amber-500" /> {report.carburant || 'Essence'}
              </div>
              {report.transmission && (
                <div className="px-4 py-2 bg-muted border border-border rounded-xl font-bold text-foreground flex items-center gap-2 capitalize shadow-sm">
                  <Settings2 className="w-4 h-4 text-muted-foreground" /> {report.transmission}
                </div>
              )}
              {report.lien_annonce && (
                <div className="flex items-center gap-2 ml-0 md:ml-auto">
                  <a href={report.lien_annonce} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md">
                    <ExternalLink className="w-4 h-4" /> Voir l'annonce
                  </a>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-rose-500" onClick={() => setShowReportModal(true)}>
                    <Flag className="w-4 h-4 mr-1" /> Signaler
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- 2. LES CHIFFRES (SCORE & PRIX) --- */}
        <div className="pdf-section grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-2xl md:rounded-[2.5rem] border-border shadow-xl dark:shadow-none bg-card overflow-hidden flex flex-col justify-center p-4 md:p-6 relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${stats.score >= 75 ? 'bg-emerald-500' : stats.score >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}></div>
            <CardContent className="text-center p-0 pt-4">
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-6 font-black text-foreground text-lg uppercase tracking-tight">
                {stats.score >= 75 ? "Achat Recommandé" : stats.score >= 50 ? "Négociation Requise" : "Vigilance Absolue"}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 rounded-2xl md:rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white overflow-hidden p-4 md:p-8 relative">
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
                  <p className="text-3xl sm:text-5xl md:text-6xl font-[1000] tracking-tighter leading-none">{safeNum(stats.prixCible)} €</p>
                </div>
              </div>
              {stats.isUnderPriced ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-600 p-3 rounded-xl">
                        <TrendingDown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">Marge de négociation</p>
                        <p className="text-2xl font-black text-slate-400">0 €</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                    <Flame className="w-6 h-6 text-emerald-400 shrink-0" />
                    <p className="text-emerald-400 font-black text-sm">
                      🔥 Sous-cotée : Économie immédiate de {safeNum(stats.economy)} € !
                    </p>
                  </div>
                </div>
              ) : stats.economy > 0 ? (
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">Marge de négociation</p>
                      <p className="text-2xl font-black text-emerald-400">{safeNum(stats.economy)} €</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-600 p-3 rounded-xl">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">Marge de négociation</p>
                      <p className="text-2xl font-black text-slate-400">0 €</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* --- 3. VERDICT EXPERT --- */}
        <div className="pdf-section bg-card border border-primary/10 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-lg shadow-primary/5 dark:shadow-none flex flex-col md:flex-row items-start gap-4 md:gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shrink-0 relative z-10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-4 relative z-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Verdict de l'Expert</h2>
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              {report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse du profil en cours d'écriture..."}
            </p>
            {signaux.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                {signaux.map((s: any, i: number) => (
                  <Badge key={i} className={`font-bold text-[10px] px-3 py-1 border-0 ${s.type === 'destructive' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
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
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500 w-6 h-6" /> Points Sécurisés
                  </h3>
                  <Card className="rounded-[2rem] border-emerald-200 dark:border-emerald-900/30 shadow-lg dark:shadow-none bg-emerald-50/30 dark:bg-emerald-950/20 h-full">
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-widest">Travaux & Entretiens validés</p>
                    </div>
                    {Array.isArray(entretiens) && entretiens.length > 0 ? (
                      <div className="divide-y divide-emerald-100/50 dark:divide-emerald-900/30 p-2">
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
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Receipt className="text-rose-500 w-6 h-6" /> Frais à Prévoir
                  </h3>
                  <Card className="rounded-[2rem] border-rose-100 dark:border-rose-900/30 shadow-lg dark:shadow-none bg-card h-full flex flex-col">
                    <div className="bg-rose-50/50 dark:bg-rose-950/20 px-6 py-4 border-b border-rose-100 dark:border-rose-900/30">
                      <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Fiabilisation estimée</p>
                    </div>
                    <div className="divide-y divide-dashed divide-border flex-1 p-2">
                      {devisItems.length > 0 ? devisItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3">
                          <span className={`font-bold text-sm pr-4 leading-tight ${item.deja_fait ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground/80'}`}>
                            {item.piece}
                          </span>
                          {item.deja_fait ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-[9px] uppercase tracking-widest px-2 py-0.5 shrink-0 whitespace-nowrap">Déjà fait</Badge>
                          ) : (
                            <span className="text-foreground font-black whitespace-nowrap">+{safeNum(item.cout_euros)} €</span>
                          )}
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-400 font-medium text-sm h-full flex items-center justify-center">
                          Aucun frais immédiat détecté.
                        </div>
                      )}
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-5 flex justify-between items-center border-t-2 border-rose-200 dark:border-rose-900/30">
                      <span className="font-black text-rose-900 dark:text-rose-300 uppercase text-xs tracking-widest">Impact sur le prix</span>
                      <span className="text-2xl font-black text-rose-600 tracking-tighter">{safeNum(total)} €</span>
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* --- 5. LE PLAYBOOK (ÉTAPE PAR ÉTAPE) --- */}
        <div className="pdf-section space-y-8 pt-8 border-t border-border">
          <div>
            <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
              <Target className="w-7 h-7 text-primary" /> Playbook de Négociation
            </h3>
            <p className="text-muted-foreground font-medium mt-1">Votre stratégie pas-à-pas pour sécuriser cet achat au meilleur prix.</p>
          </div>
          
          <div className="grid gap-6">
            {negotiationPoints.map((nego: any, i: number) => {
              const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
              const smsText = smsMatch ? smsMatch[1].trim() : null;
              const isSMSBlock = !!smsText;
              
              return (
                <Card key={i} className="border-border shadow-md dark:shadow-none rounded-[2rem] overflow-hidden break-inside-avoid bg-card">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-muted p-6 md:p-8 flex md:flex-col items-center justify-center md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-border">
                      <div className="w-12 h-12 rounded-2xl bg-card shadow-sm border border-border text-primary flex items-center justify-center font-black text-xl mb-0 md:mb-2 mr-4 md:mr-0">
                        {i+1}
                      </div>
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hidden md:block text-center">Étape</span>
                      <span className="font-black text-foreground md:hidden">{nego.titre}</span>
                    </div>
                    <div className="p-6 md:p-8 flex-1">
                      <h4 className="font-black text-xl text-foreground mb-4 hidden md:block">{nego.titre}</h4>
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

        {/* --- 6. ÉQUIPEMENTS CLÉS --- */}
        {isSingleAudit && Array.isArray(singleAuditData?.options) && singleAuditData.options.length > 0 && (
          <div className="pdf-section space-y-6 pt-8 border-t border-border break-inside-avoid">
            <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
              <Settings2 className="w-7 h-7 text-muted-foreground" /> Équipements & Options détectés
            </h3>
            <SmartOptionsDisplay options={singleAuditData.options} />
          </div>
        )}

        {/* --- RADAR SNIPER --- */}
        {!isSingleAudit && vehiclesData.length > 0 && (
          <div className="pt-12 border-t border-border space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter">Analyse de Marché</h2>
                <p className="text-muted-foreground font-bold mt-1">Positionnement de l'offre sur {stats.totalVehicules} annonces.</p>
              </div>
              <Badge className="bg-foreground text-background font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest border-0">Data Live</Badge>
            </div>
            <Card className="rounded-2xl md:rounded-[3rem] shadow-xl border-0 overflow-hidden h-[350px] md:h-[500px] bg-slate-950 p-3 md:p-6">
              <SniperChart data={vehiclesData} trendLine={calculateLogTrendLine(vehiclesData)} onVehicleClick={setSelectedVehicle} />
            </Card>
          </div>
        )}

        {/* --- DISCLAIMER --- */}
        <div className="mt-10 md:mt-16 p-4 md:p-8 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 md:gap-4 items-start">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground text-base mb-2">Notre mission : Vous protéger</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La Truffe a été conçue pour vous accompagner et vous donner l'avantage lors de votre achat. Ce rapport est une aide à la décision générée par notre moteur d'analyse exclusif à partir des données fournies par le vendeur. Bien qu'il détecte la majorité des pièges, il ne remplace pas votre vigilance lors de l'essai physique du véhicule. Gardez l'œil ouvert, et bonne route !
            </p>
          </div>
        </div>

        {/* --- OWNER: Rating CTA --- */}
        {isOwner && (
          <div className="flex justify-center pt-4 pb-8">
            {reviewSubmitted ? (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5" /> Merci pour votre avis !
              </div>
            ) : (
              <Button
                onClick={() => setShowRatingModal(true)}
                size="lg"
                className="rounded-2xl font-black text-base px-8 py-6 shadow-xl shadow-primary/20 gap-2"
              >
                <Star className="w-5 h-5" /> Noter La Truffe et laisser un avis
              </Button>
            )}
          </div>
        )}

      </main>

      {/* Sticky mobile share button - owner only */}
      {isOwner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden print:hidden">
          <Button
            onClick={handleShareNegotiation}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-14 shadow-2xl shadow-emerald-600/30 text-base gap-2"
          >
            {isShareCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            {isShareCopied ? 'Lien copié !' : 'Partager au vendeur 🤝'}
          </Button>
        </div>
      )}

      {/* Visitor: Sticky CTA Banner */}
      {!isOwner && <StickyCtaBanner />}

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">⭐ Notez votre expérience</DialogTitle>
            <DialogDescription>Votre avis nous aide à améliorer La Truffe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Star rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-bold text-muted-foreground">
                {rating === 5 ? '🔥 Excellent !' : rating === 4 ? '👍 Très bien !' : rating === 3 ? '😐 Correct' : rating === 2 ? '😕 Peut mieux faire' : '😞 Décevant'}
              </p>
            )}
            <Textarea
              placeholder="Un commentaire ? (optionnel)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || isSubmittingReview}
              className="w-full rounded-xl font-bold h-12"
            >
              {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Envoyer mon avis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
      <ReportAdModal open={showReportModal} onOpenChange={setShowReportModal} adUrl={report?.lien_annonce || ''} />
    </div>
  );
};

export default ReportView;
