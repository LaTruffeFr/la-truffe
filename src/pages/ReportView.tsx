import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Download, CheckCircle2, TrendingDown, Calendar, Gauge, Fuel, 
  Euro, ShieldCheck, Loader2, Search, History, ExternalLink,
  Brain, Calculator, FileCheck, Copy, Check, Snowflake, Flame, CircleDashed, 
  Settings2, BrainCircuit, MessageSquareWarning, Zap, Cpu,
  ScanSearch, Microscope, Fingerprint, Activity, Receipt, AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SniperChart } from '@/components/trading/SniperChart';
import { OpportunityModal } from '@/components/trading/OpportunityModal';
import { Footer } from '@/components/landing';
import { generatePDF } from '@/lib/pdfGenerator';
import { ProxiedImage } from '@/components/ProxiedImage';

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto drop-shadow-xl">
      <svg className="transform -rotate-90 w-44 h-44">
        <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
        <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-6xl font-[1000] tracking-tighter ${colorClass}`}>{score}</span>
        <Badge variant="outline" className="mt-1 border-slate-200 text-[10px] font-black uppercase tracking-widest bg-white">Indice Truffe</Badge>
      </div>
    </div>
  );
};

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

  // 1. CHARGEMENT DU RAPPORT
  const fetchReport = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/client'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchReport(); }, [id]);

  // 2. CALCULS DES DONNÉES (Mémorisés pour éviter les erreurs de définition)
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

  // 3. ANIMATION DE CHARGEMENT
  useEffect(() => {
    if (report?.status !== 'in_progress' && report?.status !== 'pending') return;
    const startTime = Date.now();
    let animationFrameId: number;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const targetPercent = Math.min((elapsed / 15000) * 100, 95);
      setProgressPercent(targetPercent);
      if (targetPercent < 95) animationFrameId = requestAnimationFrame(updateProgress);
    };
    animationFrameId = requestAnimationFrame(updateProgress);
    PROGRESS_STEPS.forEach((step, index) => { setTimeout(() => setProgressIndex(index), step.time); });
    return () => cancelAnimationFrame(animationFrameId);
  }, [report?.status]);

  // 4. ACTIONS
  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "Argument prêt à l'envoi." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    const success = await generatePDF('report-content', `Rapport_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "PDF téléchargé." });
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!report || !stats) return null;

  // --- VUE CHARGEMENT ---
  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-8 animate-in fade-in">
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-indigo-50 flex items-center justify-center mx-auto">
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expertise en cours</h2>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <Progress value={progressPercent} className="h-1.5 bg-slate-100" />
            <div className="space-y-4 text-left">
              {PROGRESS_STEPS.map((step, index) => (
                <div key={index} className={`flex items-center gap-4 ${index <= progressIndex ? "text-indigo-600 font-bold" : "text-slate-300"}`}>
                  <step.icon className="w-5 h-5" />
                  <span className="text-sm">{step.label}</span>
                </div>
              ))}
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
      
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 h-20 flex items-center px-6 print:hidden">
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link to="/" className="font-[1000] text-2xl tracking-tighter flex items-center gap-3">
             La Truffe <Badge className="bg-slate-900 text-white text-[10px]">V12 CERTIFIED</Badge>
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/client')} className="font-bold">Retour</Button>
            <Button onClick={handleDownload} disabled={isGeneratingPdf} className="bg-indigo-600 text-white font-black rounded-xl">
              {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download className="w-4 h-4 mr-2" />} PDF
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-12 max-w-7xl space-y-16">
        
        {/* --- CINEMATIC HEADER --- */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="relative w-full lg:w-1/2">
            <div className="aspect-[4/3] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white bg-white">
              <img src={imageCover} className="w-full h-full object-cover" alt="Car" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center shadow-2xl border-[6px] border-white rotate-12">
               <ShieldCheck className="w-8 h-8 mb-1" />
               <span className="text-[10px] font-black uppercase text-center px-2">Certifié V12</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center lg:text-left">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black px-4 py-2 uppercase tracking-widest text-[10px] rounded-full">
              {isSingleAudit ? 'Audit Chirurgical' : 'Analyse de Marché'}
            </Badge>
            <h1 className="text-6xl md:text-8xl font-[1000] text-slate-900 tracking-tighter leading-[0.9]">
              {report.marque} <br/> <span className="text-indigo-600 uppercase">{report.modele}</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
               <Badge variant="outline" className="px-4 py-2 rounded-xl border-slate-200 text-lg font-black"><Calendar className="w-4 h-4 mr-2" /> {report.annee}</Badge>
               <Badge variant="outline" className="px-4 py-2 rounded-xl border-slate-200 text-lg font-black"><Gauge className="w-4 h-4 mr-2" /> {safeNum(report.kilometrage)} km</Badge>
            </div>
          </div>
        </div>

        {/* --- GRID RÉSULTATS --- */}
        <div className="grid lg:grid-cols-3 gap-10">
          <Card className="rounded-[4rem] border-0 shadow-2xl bg-white flex flex-col justify-center py-16 relative">
            <div className={`absolute top-0 left-0 w-full h-3 ${stats.score >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
            <CardContent className="text-center">
              <ScoreCircularGauge score={stats.score} />
              <p className="mt-8 font-black text-slate-900 text-2xl uppercase tracking-tighter">
                {stats.score >= 80 ? "Achat Recommandé" : "Offre à Négocier"}
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-[4rem] border-0 shadow-2xl bg-slate-950 text-white overflow-hidden p-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-white/5">
              <div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-4">Prix de l'annonce</p>
                <p className={`text-5xl font-black ${stats.economy > 0 ? 'text-white/20 line-through decoration-rose-500' : 'text-white'}`}>
                  {safeNum(stats.prixAffiche)} €
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-black uppercase text-[10px] tracking-widest mb-4">Vraie Cote La Truffe</p>
                <p className="text-8xl font-[1000] tracking-tighter">{safeNum(stats.prixCible)} €</p>
              </div>
            </div>
            <div className="mt-10 flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <TrendingDown className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-slate-500 font-black text-xs uppercase">Marge de négociation</p>
                 <p className="text-4xl font-black text-emerald-400">-{safeNum(Math.abs(stats.economy))} €</p>
               </div>
            </div>
          </Card>
        </div>

        {/* --- VERDICT IA --- */}
        <div className="bg-indigo-600 rounded-[4rem] p-12 lg:p-20 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Brain className="w-64 h-64" /></div>
          <div className="relative z-10 space-y-8 max-w-5xl">
            <h2 className="text-xl font-black uppercase tracking-[0.3em] opacity-80">Verdict du Cerveau Hybride</h2>
            <p className="text-2xl md:text-4xl font-medium italic font-serif leading-tight">
              "{report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse confidentielle..."}"
            </p>
            <div className="flex flex-wrap gap-2">
              {signaux.map((s: any, i: number) => (
                <Badge key={i} className={`font-black px-4 py-2 border-0 ${s.type === 'destructive' ? 'bg-rose-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* --- PLAYBOOK & FACTURE --- */}
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <h3 className="text-4xl font-[1000] text-slate-900 tracking-tighter">Playbook Stratégique</h3>
            <div className="space-y-16 border-l-[6px] border-slate-100 pl-16 ml-8 relative">
              {negotiationPoints.map((nego: any, i: number) => {
                const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                const smsText = smsMatch ? smsMatch[1].trim() : null;
                return (
                  <div key={i} className="relative">
                    <div className="absolute -left-[90px] top-0 w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-2xl border-4 border-white">
                      {i + 1}
                    </div>
                    <h4 className="font-black text-2xl mb-4">{nego.titre}</h4>
                    {smsText ? (
                      <div className="space-y-6">
                        <p className="text-lg text-slate-600 font-medium">{nego.desc.split(smsMatch[0])[0]}</p>
                        <div className="bg-[#007AFF] text-white p-10 rounded-[3rem] rounded-bl-xl shadow-2xl relative group">
                           <p className="text-xl font-medium italic">"{smsText}"</p>
                           <Button onClick={() => handleCopySMS(smsText)} className="absolute -bottom-6 -right-6 w-16 h-16 rounded-2xl bg-slate-900 border-4 border-white shadow-2xl">
                             {isCopied ? <Check /> : <Copy />}
                           </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg text-slate-600 p-8 bg-white rounded-[2rem] border border-slate-100">{nego.desc}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-12">
             {isSingleAudit && (() => {
               let devisItems: any[] = [];
               try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
               if (devisItems.length === 0) return null;
               const total = devisItems.reduce((s, d) => s + (d.cout_euros || 0), 0);
               return (
                 <div className="space-y-8">
                   <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Receipt className="text-rose-500" /> Facture Virtuelle</h3>
                   <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                      <div className="bg-slate-50 px-10 py-5 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">Frais immédiats</div>
                      <div className="divide-y divide-slate-50">
                        {devisItems.map((item, i) => (
                          <div key={i} className="flex justify-between px-10 py-6 font-bold">
                            <span className="text-slate-600">{item.piece}</span>
                            <span>+{safeNum(item.cout_euros)} €</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-rose-500 p-10 flex justify-between items-center text-white font-black">
                        <span className="uppercase text-xs tracking-widest opacity-80">Total Malus</span>
                        <span className="text-4xl tracking-tighter">{safeNum(total)} €</span>
                      </div>
                   </div>
                 </div>
               );
             })()}
          </div>
        </div>

      </main>
      <Footer />
      {selectedVehicle && <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />}
    </div>
  );
};

export default ReportView;
