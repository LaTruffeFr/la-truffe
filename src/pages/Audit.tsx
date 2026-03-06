import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVipAccess } from "@/hooks/useVipAccess";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Link as LinkIcon, Loader2, Activity, 
  Receipt, CheckCircle2, Zap, Sparkles,
  ShieldCheck, ExternalLink, AlertCircle
} from "lucide-react";

const AUDIT_STEPS = [
  'Scraping de l\'annonce...',
  'Interrogation de l\'IA Agentique...',
  'Détection des tags et signaux...',
  'Calcul de la vraie cote...',
  'Génération du Playbook...',
];

export default function AuditPage() {
  const { user, isLoading: authLoading, credits, refreshCredits, isAdmin } = useAuth();
  const { hasUnlimitedCredits } = useVipAccess();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [url, setUrl] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const isLeboncoin = useMemo(() => url.toLowerCase().includes('leboncoin'), [url]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/audit&message=Veuillez créer un compte pour utiliser le scanner d'URL");
    }
  }, [user, authLoading, navigate]);

  // Animated loading steps
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setLoadingStepIndex(s => (s + 1) % AUDIT_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    setLoadingStep(AUDIT_STEPS[loadingStepIndex]);
  }, [loadingStepIndex]);

  // Progress bar
  useEffect(() => {
    if (!isAnalyzing) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 1, 95));
    }, 160);
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans px-4">
        <div className="relative mb-8">
          <Activity className="w-24 h-24 text-indigo-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-50 animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-extrabold mb-4 tracking-tight text-center">Analyse de l'annonce en cours...</h2>
        <div className="flex items-center gap-3 text-indigo-300 font-medium text-lg bg-white/5 px-6 py-3 rounded-full border border-white/10">
          <Loader2 className="w-5 h-5 animate-spin" /> {loadingStep}
        </div>
        <div className="w-64 mt-8 space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-400 text-center">{progress}% — Veuillez patienter…</p>
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
    </div>
  );
}
