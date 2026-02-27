import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { 
  Search, Link as LinkIcon, Loader2, BrainCircuit, 
  Receipt, CheckCircle2, TrendingUp, Zap, Sparkles,
  ShieldCheck, ArrowRight
} from "lucide-react";

export default function AuditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [report, setReport] = useState<any>(null);

  // 🔒 SÉCURITÉ : On redirige vers l'auth si l'utilisateur n'est pas connecté
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
      await new Promise(r => setTimeout(r, 1500)); // Effet de réflexion IA

      setLoadingStep("Génération du Playbook de négociation...");
      await new Promise(r => setTimeout(r, 1000));

      setReport(data);
    } catch (error: any) {
      console.error(error);
      alert("Erreur lors de l'analyse : Vérifiez l'URL (Leboncoin ou La Centrale uniquement).");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Gestion du chargement initial de la session
  if (authLoading) return null;
  if (!user) return null;

  // --- ÉCRAN DE CHARGEMENT IA (CERVEAU PULSANT) ---
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans px-4">
        <div className="relative mb-8">
          <BrainCircuit className="w-24 h-24 text-indigo-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-50 animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-extrabold mb-4 tracking-tight text-center">Analyse de l'annonce en cours...</h2>
        <div className="flex items-center gap-3 text-indigo-300 font-medium text-lg bg-white/5 px-6 py-3 rounded-full border border-white/10">
          <Loader2 className="w-5 h-5 animate-spin" /> {loadingStep}
        </div>
        <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 animate-[ping_1.5s_infinite_alternate]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      <Header />

      {/* BANNIÈRE HERO DÉDIÉE */}
      <div className="bg-slate-900 pt-32 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" /> Expertise IA Professionnelle
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
            Scanner d'Annonce <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">La Truffe</span>
          </h1>
          
          {/* BARRE DE RECHERCHE GÉANTE */}
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 mt-8">
            <div className="flex-1 flex items-center pl-4">
              <LinkIcon className="w-6 h-6 text-slate-400" />
              <input
                type="url"
                placeholder="Collez l'URL Leboncoin ou La Centrale..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-3 pr-4 py-4 text-lg text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <button 
              onClick={handleAudit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95"
            >
              Auditer l'URL
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        {/* RÉSULTAT DU RAPPORT */}
        {report ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* SCORE ET COTE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center flex flex-col items-center justify-center">
                <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-4">Score de Confiance</h3>
                <div className={`text-9xl font-black leading-none mb-2 ${report.score >= 70 ? 'text-emerald-500' : report.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {report.score}
                </div>
                <p className="text-slate-400 font-bold">/ 100</p>
              </div>

              <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-10 shadow-xl text-white flex flex-col justify-center">
                <h3 className="text-indigo-400 font-black uppercase text-xs tracking-widest mb-8">Analyse de Valeur</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-slate-400 text-xs font-bold mb-2 uppercase">Prix Vendeur</p>
                    <p className="text-3xl font-bold">{report.prix_vendeur?.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div>
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

            {/* AVIS ET PLAYBOOK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

              {/* DEVIS LATRUFFE */}
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
          /* ÉTAT INITIAL (CONSEILS) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center py-12">
            {[
              { label: "Leboncoin", desc: "Copiez le lien de l'annonce depuis l'application." },
              { label: "La Centrale", desc: "Fonctionne avec toutes les annonces pro ou particuliers." },
              { label: "IA Experte", desc: "Notre algorithme traque les incohérences techniques." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold tracking-tighter italic">Lbc</div>
                <h4 className="font-bold mb-2">{item.label}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
