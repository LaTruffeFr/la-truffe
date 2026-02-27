import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { 
  Search, Link as LinkIcon, Loader2, BrainCircuit, 
  Receipt, CheckCircle2, TrendingUp, Zap, ShieldCheck,
  AlertTriangle, Info, ArrowRight, Sparkles
} from "lucide-react";

export default function AuditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [report, setReport] = useState<any>(null);

  // FORCE L'AUTHENTIFICATION : On garde la valeur ajoutée du compte
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/audit&message=Veuillez créer un compte pour utiliser le scanner d'URL");
    }
  }, [user, authLoading, navigate]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsAnalyzing(true);
    setReport(null);

    try {
      setLoadingStep("Aspiration des données de l'annonce...");
      
      const { data, error } = await supabase.functions.invoke("audit-url", {
        body: { url }
      });

      if (error) throw error;
      
      setLoadingStep("Le Cerveau Hybride traque les vices cachés...");
      await new Promise(r => setTimeout(r, 1500)); // Temps pour l'effet "Wow"

      setLoadingStep("Calcul du devis et du playbook...");
      await new Promise(r => setTimeout(r, 1000));

      setReport(data);
    } catch (error: any) {
      console.error(error);
      alert("Erreur : Vérifiez l'URL (Leboncoin ou La Centrale uniquement).");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (authLoading) return null; // Évite le flash avant redirection

  // --- ÉCRAN DE CHARGEMENT "CERVEAU HYBRIDE" ---
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="relative mb-12">
          <BrainCircuit className="w-28 h-28 text-indigo-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-black mb-6 tracking-tight text-center">Analyse Turbo en cours...</h2>
        <div className="flex items-center gap-3 text-indigo-300 font-bold text-lg bg-white/5 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-md">
          <Loader2 className="w-6 h-6 animate-spin" /> {loadingStep}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <Header />

      {/* HERO SECTION DÉDIÉE */}
      <div className="bg-slate-900 pt-32 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" /> Scanner d'annonces V11
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
            Collez. Scannez. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Négociez.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            L'IA La Truffe analyse instantanément n'importe quelle annonce Leboncoin ou La Centrale pour vous dire si c'est une affaire ou un piège.
          </p>

          {/* LA BARRE DE SCAN GÉANTE */}
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center pl-4">
              <LinkIcon className="w-6 h-6 text-slate-400" />
              <input
                type="url"
                placeholder="Collez l'URL de l'annonce ici..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-3 pr-4 py-4 text-lg text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={handleAudit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95"
            >
              Scanner l'annonce
            </button>
          </div>
        </div>
      </div>

      {/* RÉSULTAT DE L'EXPERTISE */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        {report ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* GRILLE 1 : SCORE ET COTE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Score */}
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center flex flex-col items-center justify-center relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-3xl"></div>
                <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-4">Score La Truffe</h3>
                <div className={`text-9xl font-black leading-none mb-2 ${report.score >= 70 ? 'text-emerald-500' : report.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {report.score}
                </div>
                <p className="text-slate-400 font-bold">/ 100</p>
              </div>

              {/* Cote Financière */}
              <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-10 shadow-xl text-white flex flex-col justify-center">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-indigo-400 font-black uppercase text-xs tracking-widest">Analyse de Valeur</h3>
                  <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">Marché France</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="border-r border-white/10 pr-4">
                    <p className="text-slate-400 text-xs font-bold mb-2 uppercase">Prix Vendeur</p>
                    <p className="text-3xl font-bold">{report.prix_vendeur?.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="border-r border-white/10 pr-4">
                    <p className="text-slate-400 text-xs font-bold mb-2 uppercase">Vraie Cote IA</p>
                    <p className="text-3xl font-bold text-indigo-400">{report.vraie_cote?.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold mb-2 uppercase">Marge Nego</p>
                    <p className={`text-3xl font-black ${report.marge > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {report.marge > 0 ? "+" : ""}{report.marge?.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GRILLE 2 : AVIS ET PLAYBOOK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Colonne Gauche : Avis & Playbook */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-indigo-600" /> L'avis du Cerveau Hybride
                  </h3>
                  <p className="text-xl text-slate-600 leading-relaxed italic bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100">
                    "{report.avis}"
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <Zap className="w-8 h-8 text-amber-500" /> Playbook de Négociation
                  </h3>
                  <div className="space-y-8">
                    {report.playbook?.map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xl mb-3">{step.titre}</h4>
                          <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colonne Droite : Devis */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden h-fit sticky top-24">
                <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-bold">Frais à prévoir</h3>
                </div>
                <div className="p-8">
                  {report.devis && report.devis.length > 0 ? (
                    <>
                      <div className="space-y-4 mb-8">
                        {report.devis.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <span className="text-slate-600 font-medium">{item.piece}</span>
                            <span className="font-bold text-slate-900">{item.cout_euros} €</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-900 p-5 rounded-2xl text-center">
                        <p className="text-indigo-400 text-xs font-bold uppercase mb-1">Total Estimé</p>
                        <p className="text-3xl font-black text-white">
                          {report.devis.reduce((acc: number, curr: any) => acc + curr.cout_euros, 0).toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-20" />
                      <p className="text-slate-500 font-bold">Aucun frais détecté</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ÉTAT VIDE : CONSEILS */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center py-12">
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold italic">Lbc</div>
              <h4 className="font-bold mb-2">Leboncoin</h4>
              <p className="text-sm text-slate-500">Copiez le lien complet de l'annonce depuis l'application ou le site.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold italic">Lc</div>
              <h4 className="font-bold mb-2">La Centrale</h4>
              <p className="text-sm text-slate-500">Fonctionne avec toutes les annonces de professionnels ou de particuliers.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2">Certification</h4>
              <p className="text-sm text-slate-500">Chaque audit est sauvegardé dans votre espace client personnel.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
