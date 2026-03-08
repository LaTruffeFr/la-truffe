import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { 
  ShieldCheck, Search, Car as CarIcon, 
  ArrowRight, LineChart, Wrench, CheckCircle2, Zap, AlertTriangle, PlayCircle, Star, ScanSearch
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Capture referral code from URL on landing
function useReferralCapture() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('referral_code', ref);
  }, [searchParams]);
}

export default function Landing() {
  useReferralCapture();
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <Header />

      {/* --- HERO SECTION : PREMIUM & DARK --- */}
      <div className="relative bg-slate-900 pt-32 pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-[0.07] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[120px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900"></div>
        
        <div className="relative max-w-7xl mx-auto z-10 text-center">
          <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 mb-8 rounded-full font-bold uppercase tracking-widest text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700 flex items-center gap-2 mx-auto w-fit">
            <ShieldCheck className="w-4 h-4" /> La 1ère IA experte en mécanique
          </Badge>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-[1.1]">
            Ne vous faites plus <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">arnaquer</span> <br className="hidden md:block" />
            sur le marché de l'occasion.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            La Truffe analyse les annonces, détecte les vices cachés, calcule le devis des réparations et vous donne la vraie valeur de la voiture en 5 secondes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link to="/audit" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 text-lg">
              Scanner une annonce <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/marketplace" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 text-lg backdrop-blur-sm">
              Voir la Marketplace <CarIcon className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium animate-in fade-in duration-1000 delay-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Compatible Leboncoin & La Centrale
          </div>
        </div>
      </div>

      {/* --- LES 4 PILIERS (CARTES FLOTTANTES) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARTE 1 : AUDIT URL */}
          <Link to="/audit" className="group bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors shadow-sm">
              <Search className="w-8 h-8 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Auditer une annonce</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow leading-relaxed">
              Collez un lien. L'IA traque les arnaques, les compteurs trafiqués et les frais cachés.
            </p>
            <div className="flex items-center text-indigo-600 font-bold">
              Lancer l'audit <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 2 : MARKETPLACE */}
          <Link to="/marketplace" className="group bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-sm">
              <CarIcon className="w-8 h-8 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Acheter sereinement</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow leading-relaxed">
              Parcourez notre catalogue exclusif de véhicules déjà certifiés et audités par La Truffe.
            </p>
            <div className="flex items-center text-blue-600 font-bold">
              Voir les annonces <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 3 : VENDRE */}
          <Link to="/vendre" className="group bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors shadow-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Vendre plus vite</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow leading-relaxed">
              Publiez votre voiture. Notre certification IA rassure les acheteurs et justifie votre prix.
            </p>
            <div className="flex items-center text-emerald-600 font-bold">
              Déposer une annonce <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 4 : COTE AUTO */}
          <Link to="/cote" className="group bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors shadow-sm">
              <LineChart className="w-8 h-8 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Estimer sa valeur</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow leading-relaxed">
              Obtenez la vraie cote marché instantanée de votre véhicule avec notre algorithme.
            </p>
            <div className="flex items-center text-purple-600 font-bold">
              Calculer la cote <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

      {/* --- EXEMPLE VISUEL (AVANT / APRÈS L'IA) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-64 h-64" /></div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 mb-6">Démonstration</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
                Le vendeur dit : <br/><span className="text-slate-400 font-medium italic">"Rien à prévoir."</span>
              </h2>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8">
                La Truffe répond : <br/><span className="text-emerald-400">"Préparez 1 500€."</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">
                En lisant simplement l'annonce, notre IA détecte le code moteur exact. Elle sait que sur cette version précise, la courroie de distribution et la pompe à eau doivent être changées à 120 000 km. Si ce n'est pas précisé dans l'annonce, c'est pour votre pomme.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> Génération d'un devis prévisionnel</li>
                <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> Création d'un Playbook de négociation</li>
                <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> Score de confiance sur 100</li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-3xl blur-2xl opacity-20"></div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 relative z-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Avis de La Truffe</h4>
                    <p className="text-slate-400 text-sm">BMW Série 1 120i (125 000 km)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Pompe à eau (Maladie connue)</span>
                    <span className="text-rose-400 font-bold">~ 650 €</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Vidange boîte auto (Échéance)</span>
                    <span className="text-rose-400 font-bold">~ 450 €</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Bougies d'allumage</span>
                    <span className="text-rose-400 font-bold">~ 200 €</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Frais cachés estimés</span>
                    <span className="text-white font-black text-2xl">1 300 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION COMMENT ÇA MARCHE --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Le mécanicien le plus <span className="text-indigo-600">incorruptible</span>.</h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">Notre intelligence artificielle a été entraînée sur des milliers de fiches techniques, pannes récurrentes et données du marché automobile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">1. Analyse contextuelle</h3>
            <p className="text-slate-600 font-medium leading-relaxed">L'IA lit entre les lignes : elle identifie le code moteur précis, détecte les modifications illégales (décata, stage 1) et repère les incohérences temporelles.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 relative">
              <Wrench className="w-8 h-8 text-rose-600" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center border-2 border-white">
                <AlertTriangle className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">2. Diagnostic prédictif</h3>
            <p className="text-slate-600 font-medium leading-relaxed">Boîte EDC fragile, chaîne de distribution qui se décale, surconsommation d'huile... L'IA connaît le talon d'Achille de chaque motorisation.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">3. L'Arme de Négociation</h3>
            <p className="text-slate-600 font-medium leading-relaxed">Elle soustrait les factures récentes et génère un devis prévisionnel précis des frais à prévoir pour vous donner le pouvoir lors de la négociation.</p>
          </div>
        </div>
      </div>

      {/* --- CTA BANNER --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-10">
        <div className="bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 relative z-10 tracking-tight">Prêt à acheter en confiance ?</h2>
          <p className="text-indigo-100 text-xl md:text-2xl font-medium mb-12 max-w-2xl mx-auto relative z-10">
            Rejoignez les acheteurs malins qui utilisent La Truffe pour sécuriser leurs transactions.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <Link to="/audit" className="px-8 py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg">
              Auditer une annonce
            </Link>
            <Link to="/marketplace" className="px-8 py-5 bg-indigo-800 text-white font-black rounded-2xl border border-indigo-500 hover:bg-indigo-900 transition-all text-lg">
              Voir la Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
