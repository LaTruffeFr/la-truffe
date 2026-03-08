import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVipAccess } from "@/hooks/useVipAccess";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PricingModal from "@/components/billing/PricingModal";
import { 
  Link as LinkIcon, Loader2, ScanSearch, 
  Receipt, CheckCircle2, Zap, Sparkles,
  ShieldCheck, ExternalLink, AlertCircle,
  Cpu, ShieldAlert, Calculator, FileCheck
} from "lucide-react";

const AUDIT_STEPS = [
  { time: 0, label: "Flairage de l'annonce et extraction des données...", icon: ScanSearch, percent: 15 },
  { time: 3000, label: "Analyse du pedigree mécanique...", icon: Cpu, percent: 40 },
  { time: 6000, label: "Traque des vices cachés et arnaques...", icon: ShieldAlert, percent: 65 },
  { time: 9000, label: "Calcul de la vraie cote La Truffe...", icon: Calculator, percent: 85 },
  { time: 12000, label: "Rédaction finale du rapport d'expertise...", icon: FileCheck, percent: 98 },
];

export default function AuditPage() {
  const { user, isLoading: authLoading, credits, refreshCredits, isAdmin } = useAuth();
  const { hasUnlimitedCredits } = useVipAccess();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [url, setUrl] = useState(searchParams.get('url') || "");
  const [manualDescription, setManualDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPricing, setShowPricing] = useState(false);

  const isLeboncoin = useMemo(() => url.toLowerCase().includes('leboncoin'), [url]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/audit&message=Veuillez créer un compte pour utiliser le scanner d'URL");
    }
  }, [user, authLoading, navigate]);

  // Animated loading steps - synchronized with AUDIT_STEPS
  useEffect(() => {
    if (!isAnalyzing) { setLoadingStepIndex(0); setProgress(0); return; }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      let currentStepIndex = 0;
      for (let i = AUDIT_STEPS.length - 1; i >= 0; i--) {
        if (elapsed >= AUDIT_STEPS[i].time) {
          currentStepIndex = i;
          break;
        }
      }
      
      setLoadingStepIndex(currentStepIndex);
      setProgress(AUDIT_STEPS[currentStepIndex].percent);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast({ variant: "destructive", title: "Lien manquant", description: "Collez le lien d'une annonce." });
      return;
    }

    // Validate URL domain
    const supportedDomains = ['leboncoin.fr', 'lacentrale.fr', 'autoscout24.', 'mobile.de'];
    try {
      const parsed = new URL(trimmedUrl);
      if (!supportedDomains.some(d => parsed.hostname.includes(d))) {
        toast({ variant: "destructive", title: "Site non supporté", description: "Seuls LeBonCoin, La Centrale, AutoScout24 et Mobile.de sont supportés." });
        return;
      }
    } catch {
      toast({ variant: "destructive", title: "URL invalide", description: "Veuillez entrer une URL valide." });
      return;
    }

    if (!user) { navigate('/auth'); return; }

    // Check credits before starting audit
    if (!hasUnlimitedCredits && credits < 1) {
      setShowPricing(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('audit-url', {
        body: { url: trimmedUrl, manualDescription: manualDescription.trim() || undefined },
      });

      if (error) throw new Error(error.message || "Erreur lors de l'appel à l'audit");
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Analyse terminée ! ✅",
        description: "Votre rapport d'audit est prêt.",
        className: "bg-green-600 text-white border-0",
      });

      setUrl('');
      setManualDescription('');
      await refreshCredits();

      if (data?.reportId) {
        navigate(`/report/${data.reportId}`);
      }
    } catch (error: any) {
      console.error('Audit error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'analyser l'annonce. Réessayez.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (authLoading) return null;
  if (!user) return null;

  // --- ÉCRAN DE CHARGEMENT IA ---
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Effet de brume en fond */}
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
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-slate-100">
            
            {/* Barre de pourcentage */}
            <div className="mb-8 relative">
              <div className="flex justify-between text-xs font-black text-indigo-600 mb-3 px-1">
                <span className="uppercase tracking-widest">Progression globale</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>

            {/* Timeline verticale des étapes */}
            <div className="space-y-6 relative ml-2">
              <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-100 z-0" />
              
              {AUDIT_STEPS.map((step, index) => {
                const isCompleted = index < loadingStepIndex;
                const isCurrent = index === loadingStepIndex;
                
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      <Header />

      {/* BANNIÈRE HERO */}
      <div className="bg-slate-900 pt-32 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" /> Expertise IA Professionnelle
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
            Scanner d'Annonce <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">La Truffe</span>
          </h1>
          
          {/* BARRE DE RECHERCHE */}
          <form onSubmit={handleAudit} className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 mt-8">
            <div className="flex-1 flex items-center pl-4">
              <LinkIcon className="w-6 h-6 text-slate-400" />
              <input
                type="url"
                placeholder="Collez l'URL Leboncoin, La Centrale, AutoScout24 ou Mobile.de..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-3 pr-4 py-4 text-lg text-slate-900 outline-none placeholder:text-slate-400"
                required
                disabled={isAnalyzing}
              />
            </div>
            <button 
              type="submit"
              disabled={isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" /> Auditer l'URL
              </span>
            </button>
          </form>

          {/* Textarea Leboncoin fallback */}
          {isLeboncoin && !isAnalyzing && (
            <div className="max-w-3xl mx-auto mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea
                placeholder="Leboncoin bloque parfois La Truffe. Pour une expertise parfaite, copiez-collez la description de l'annonce ici (Optionnel)"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] rounded-xl backdrop-blur-sm focus:border-indigo-400"
              />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary" className="text-xs font-normal bg-white/10 text-white/70 border-white/10">LeBonCoin</Badge>
            <Badge variant="secondary" className="text-xs font-normal bg-white/10 text-white/70 border-white/10">La Centrale</Badge>
            <Badge variant="secondary" className="text-xs font-normal bg-white/10 text-white/70 border-white/10">AutoScout24</Badge>
            <Badge variant="secondary" className="text-xs font-normal bg-white/10 text-white/70 border-white/10">Mobile.de</Badge>
          </div>

          <p className="text-xs text-slate-400/60 mt-2 text-center">🌍 L'IA traduit et analyse automatiquement les annonces étrangères.</p>

          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> L'analyse IA prend environ 15 secondes. 
            {hasUnlimitedCredits 
              ? <span className="ml-1">Crédits : <strong className="text-white">Illimités 👑</strong></span>
              : <span className="ml-1">Crédits restants : <strong className="text-white">{credits}</strong></span>
            }
          </p>
        </div>
      </div>

      {/* ÉTAT INITIAL (CONSEILS) */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center py-12">
          {[
            { icon: <Sparkles className="w-6 h-6 text-indigo-600" />, label: "Leboncoin", desc: "Copiez le lien de l'annonce depuis l'application." },
            { icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />, label: "La Centrale", desc: "Fonctionne avec toutes les annonces pro ou particuliers." },
            { icon: <Zap className="w-6 h-6 text-indigo-600" />, label: "IA Experte", desc: "Notre algorithme traque les incohérences techniques." }
          ].map((item, i) => (
            <div key={i} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <h4 className="font-bold mb-2">{item.label}</h4>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
    </div>
  );
}
