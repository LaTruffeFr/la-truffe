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
  const glowClass = score >= 80 ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' : score >= 60 ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]';

  return (
    <div className={`relative flex items-center justify-center w-44 h-44 mx-auto ${glowClass}`}>
      <svg className="transform -rotate-90 w-44 h-44">
        <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
        <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-6xl font-[900] tracking-tighter ${colorClass}`}>{score}</span>
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

  const fetchReport = async () => {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error || !data) { navigate('/client'); return; }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchReport(); }, [id]);

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

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "L'argumentaire est prêt." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    const success = await generatePDF('report-content', `Expertise_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "Rapport téléchargé.", className: "bg-emerald-600 text-white" });
  };

  const vehiclesData = useMemo(() => report?.vehicles_data || [], [report]);
  const isSingleAudit = useMemo(() => report?.market_data?.type === 'single_audit', [report]);
  const singleAuditData = useMemo(() => isSingleAudit ? report?.market_data : null, [report, isSingleAudit]);
  
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

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Initialisation...</p>
    </div>
  );

  // --- LOADING LAB STYLE ---
  if (report?.status === 'in_progress' || report?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-12 animate-in fade-in duration-1000">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50">
            <Activity className="w-12 h-12 text-indigo-600 animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-[#F8FAFC]">
               <Check className="w-3 h-3 stroke-[4]" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Expertise en cours</h2>
            <p className="text-slate-500 font-medium">Analyse structurelle et financière du véhicule...</p>
          </div>
          <div className="space-y-6 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                <span>Diagnostic IA</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />
            </div>
            <div className="space-y-5 pt-4">
              {PROGRESS_STEPS.map((step, index) => {
                const isActive = index === progressIndex;
                const isPast = index < progressIndex;
                return (
                  <div key={index} className={`flex items-center gap-5 transition-all duration-700 ${isActive ? "scale-105 text-indigo-600" : isPast ? "text-emerald-500 opacity-60" : "text-slate-300 opacity-40"}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isActive ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}>
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-sm font-black tracking-tight ${isActive ? "opacity-100" : "opacity-80"}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* --- PREMIUM STICKY HEADER --- */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 h-20 flex items-center transition-all print:hidden">
        <div className="container mx-auto px-4 flex items-center justify-between max-w-7xl">
          <Link to="/" className="font-[1000] text-3xl tracking-tighter text-slate-900 flex items-center gap-3">
            <div className="bg-slate-900 text-white p-1.5 rounded-xl shadow-lg shadow-slate-200"><BrainCircuit className="w-6 h-6" /></div>
            La Truffe
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')} className="font-black text-slate-500 hover:text-slate-900 rounded-xl px-5">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button onClick={handleDownload} disabled={isGeneratingPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-indigo-100 transition-all active:scale-95">
              {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 mr-3" />} Télécharger le Rapport
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-16 max-w-7xl space-y-16">
        
        {/* --- HERO SECTION : CINEMATIC SHOT --- */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="relative group w-full lg:w-1/2">
            <div className="absolute -inset-4 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="relative aspect-[4/3] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border-[12px] border-white bg-white">
              <img 
                src={isSingleAudit ? (singleAuditData?.image_url || `data:image/png;base64,${singleAuditData?.screenshot}`) : vehiclesData[0]?.image} 
                alt={report.modele} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-12">
                 <p className="text-white font-black text-2xl tracking-tighter">Diagnostic Structurel OK</p>
              </div>
            </div>
            {/* Stamp Badge */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center shadow-2xl border-[6px] border-white rotate-12 animate-in zoom-in-50 duration-1000 delay-500">
               <ShieldCheck className="w-8 h-8 mb-1" />
               <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Certifié V12 Agentic</span>
            </div>
          </div>

          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black px-5 py-2 uppercase tracking-[0.2em] text-[10px] rounded-full">
                {isSingleAudit ? 'Audit Chirurgical Unitaire' : 'Analyse de Marché Globale'}
              </Badge>
              <h1 className="text-6xl md:text-8xl font-[1000] text-slate-900 tracking-tighter leading-[0.9]">
                {report.marque} <br/> <span className="text-indigo-600 uppercase">{report.modele}</span>
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
              {[
                { icon: Calendar, label: "Année", value: report.annee, color: "text-indigo-500" },
                { icon: Gauge, label: "Kilométrage", value: `${safeNum(report.kilometrage)} km`, color: "text-emerald-500" },
                { icon: Fuel, label: "Énergie", value: report.carburant || 'Essence', color: "text-amber-500" },
                { icon: Fingerprint, label: "ID Rapport", value: report.id.slice(0,8).toUpperCase(), color: "text-slate-400" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 pr-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <div className={`p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- GRID RÉSULTATS : THE FINANCIAL TRINITY --- */}
        <div className="grid lg:grid-cols-3 gap-10 pt-10">
          
          {/* Card Score */}
          <Card className="rounded-[4rem] border-0 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden flex flex-col justify-center py-16 relative group">
            <div className={`absolute top-0 left-0 w-full h-3 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
            <CardContent className="p-8 text-center space-y-10">
              <ScoreCircularGauge score={stats.score} />
              <div>
                <p className="font-[1000] text-slate-900 text-2xl uppercase tracking-tighter mb-2">
                  {stats.score >= 80 ? "Feu Vert : Foncez" : stats.score >= 60 ? "Offre à Négocier" : "Achat Risqué"}
                </p>
                <p className="text-slate-400 text-sm font-bold max-w-[200px] mx-auto leading-relaxed">
                  L'IA a validé l'offre par rapport à {stats.totalVehicules} points de contrôle.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card Pricing */}
          <Card className="lg:col-span-2 rounded-[4rem] border-0 shadow-2xl shadow-slate-200/60 bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Euro className="w-80 h-80" /></div>
            <div className="p-12 pb-0 flex items-center justify-between">
               <Badge className="bg-white/10 hover:bg-white/20 border-white/10 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-lg">Positionnement Marché</Badge>
               <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                 <Zap className="w-4 h-4" /> Live Data 2026
               </div>
            </div>
            <CardContent className="p-12 pt-10 space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-white/5">
                <div>
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Prix Affiché</p>
                  <p className={`text-5xl font-black tracking-tighter ${stats.economy > 0 ? 'text-white/20 line-through decoration-rose-500/50 decoration-[8px]' : 'text-white'}`}>
                    {safeNum(stats.prixAffiche)} €
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center md:justify-end gap-2">
                    <CheckCircle2 className="w-5 h-5"/> Vraie Cote La Truffe
                  </p>
                  <p className="text-8xl font-[1000] text-white tracking-tighter leading-none">{safeNum(stats.prixCible)} €</p>
                </div>
              </div>
              
              <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl group-hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                    <TrendingDown className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-1">Potentiel de Gain</p>
                    <p className="text-5xl font-black text-emerald-400 tracking-tighter">-{safeNum(Math.abs(stats.economy))} €</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                   <div className="text-4xl font-black text-white mb-1">{Math.round((stats.economy / stats.prixAffiche) * 100)}%</div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Économie Possible</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- AI PILARS : THREE-WAY INSIGHTS --- */}
        <div className="grid md:grid-cols-3 gap-8">
           {[
             { title: "Moteur & Boîte", icon: Cpu, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Analyse des maladies connues, rappels constructeurs et périodicité des entretiens sur cette motorisation." },
             { title: "Châssis & Admin", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Vérification de l'état apparent, cohérence du CT et conformité administrative du vendeur." },
             { title: "Psychologie Vendeur", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50", desc: "Analyse du ton de l'annonce, du lieu de vente et du profil pour détecter un marchand déguisé." }
           ].map((pilar, i) => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                <div className={`w-12 h-12 ${pilar.bg} ${pilar.color} rounded-2xl flex items-center justify-center`}>
                  <pilar.icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl text-slate-900">{pilar.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{pilar.desc}</p>
             </div>
           ))}
        </div>

        {/* --- THE VERDICT BOX --- */}
        <div className="bg-indigo-600 rounded-[4rem] p-12 lg:p-20 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.07] group-hover:scale-125 transition-transform duration-[2000ms]"><Brain className="w-80 h-80" /></div>
          <div className="relative z-10 space-y-10 max-w-5xl">
            <div className="flex items-center gap-6">
               <div className="h-px flex-1 bg-white/20"></div>
               <h2 className="text-xl font-black uppercase tracking-[0.3em] opacity-80">Verdict du Cerveau Hybride</h2>
               <div className="h-px flex-1 bg-white/20"></div>
            </div>
            <p className="text-2xl md:text-4xl font-medium leading-[1.2] italic font-serif">
              "{report.expert_opinion ? report.expert_opinion.split('|||DATA|||')[0] : "Analyse confidentielle en cours d'écriture..."}"
            </p>
            <div className="flex flex-wrap gap-3 pt-6">
              {(singleAuditData?.tags || []).map((tag: string, i: number) => (
                <Badge key={i} className="bg-white/10 hover:bg-white/20 text-white border-0 font-black px-6 py-3 rounded-2xl backdrop-blur-md text-xs uppercase tracking-widest shadow-lg">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* --- THE PLAYBOOK SMS : REALISTIC MESSAGES --- */}
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <div className="flex flex-col gap-2">
              <h3 className="text-4xl font-[1000] text-slate-900 tracking-tighter">Playbook Stratégique</h3>
              <p className="text-slate-500 font-bold">L'art de la guerre automobile : vos meilleurs leviers de négociation.</p>
            </div>

            <div className="space-y-16 relative border-l-[6px] border-slate-100 pl-16 ml-8">
              {negotiationPoints.map((nego: any, i: number) => {
                const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                const smsText = smsMatch ? smsMatch[1].trim() : null;
                return (
                  <div key={i} className="relative animate-in slide-in-from-left duration-700" style={{ transitionDelay: `${i * 150}ms` }}>
                    <div className="absolute -left-[90px] top-0 w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-2xl z-10 border-4 border-white">
                      {i + 1}
                    </div>
                    <h4 className="font-black text-2xl text-slate-900 mb-6 tracking-tight">{nego.titre}</h4>
                    
                    {smsText ? (
                      <div className="space-y-10">
                        <p className="text-lg font-medium text-slate-600 leading-relaxed">{nego.desc.split(smsMatch[0])[0]}</p>
                        <div className="relative group max-w-xl">
                          <div className="bg-[#007AFF] text-white p-10 rounded-[3rem] rounded-bl-xl shadow-2xl shadow-blue-200/50 relative overflow-hidden transition-transform hover:scale-[1.01]">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquareWarning className="w-20 h-20" /></div>
                            <p className="text-xl font-medium leading-relaxed italic relative z-10">"{smsText}"</p>
                          </div>
                          <Button 
                            onClick={() => handleCopySMS(smsText)}
                            className="absolute -bottom-6 -right-6 w-20 h-20 rounded-3xl bg-slate-900 text-white shadow-2xl border-[6px] border-white hover:bg-slate-800 transition-all active:scale-90 p-0"
                          >
                            {isCopied ? <Check className="w-8 h-8 text-emerald-400" /> : <Copy className="w-8 h-8" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-slate-600 leading-relaxed bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        {nego.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- SIDEBAR : RECEIPT & OPTIONS --- */}
          <div className="space-y-16">
            
            {/* The Maintenance Receipt */}
            {isSingleAudit && (() => {
              let devisItems: { piece: string; cout_euros: number }[] = [];
              try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
              if (!Array.isArray(devisItems) || devisItems.length === 0) return null;
              const total = devisItems.reduce((s, d) => s + (d.cout_euros || 0), 0);
              return (
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                    <Receipt className="w-7 h-7 text-rose-500" /> Facture Prévisionnelle
                  </h3>
                  <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 relative group">
                    <div className="bg-slate-50 px-10 py-6 border-b border-slate-100">
                      <p className="text-[10px] font-[1000] uppercase text-slate-400 tracking-[0.3em]">Garage Virtuel La Truffe</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {devisItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-10 py-6 hover:bg-slate-50 transition-colors">
                          <span className="text-slate-600 font-bold text-sm">{item.piece}</span>
                          <span className="text-slate-900 font-black text-sm">+{safeNum(item.cout_euros)} €</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-500 px-10 py-10 flex justify-between items-center text-white">
                      <span className="font-black uppercase text-xs tracking-widest opacity-80">Total Malus</span>
                      <span className="text-4xl font-black tracking-tighter leading-none">{safeNum(total)} €</span>
                    </div>
                  </div>
                  <Alert variant="destructive" className="bg-rose-50 border-rose-100 rounded-3xl p-6">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                    <p className="text-xs font-black text-rose-900 ml-2 uppercase tracking-widest">Attention : Frais obligatoires à court terme.</p>
                  </Alert>
                </div>
              );
            })()}

            {/* Premium Equipment */}
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                <Cpu className="w-7 h-7 text-indigo-600" /> Hardware Inclus
              </h3>
              <div className="grid gap-4">
                {(singleAuditData?.options || []).map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-300 transition-all group">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-800 text-sm tracking-tight">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- THE SNIPER RADAR : MASSIVE VIEW --- */}
        {!isSingleAudit && (
          <div className="pt-24 border-t border-slate-200 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
              <div>
                <h2 className="text-6xl font-[1000] text-slate-900 tracking-tighter">Radar Sniper</h2>
                <p className="text-slate-500 font-bold text-xl mt-3 max-w-xl">Votre {report.marque} comparée en temps réel aux opportunités du marché européen.</p>
              </div>
              <Badge className="bg-slate-900 text-white font-[1000] px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.3em] border-0 shadow-2xl">Neural Engine Analysis V12</Badge>
            </div>
            <Card className="rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-0 overflow-hidden h-[700px] bg-slate-950 p-12">
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
