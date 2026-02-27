import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { 
  ShieldCheck, Search, Car as CarIcon, BrainCircuit, 
  ArrowRight, LineChart, Wrench, CheckCircle2, Zap, AlertTriangle
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <Header />

      {/* HERO SECTION : PREMIUM & DARK */}
      <div className="relative bg-slate-900 pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900"></div>
        
        <div className="relative max-w-7xl mx-auto z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold mb-8 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <BrainCircuit className="w-4 h-4" /> La 1ère IA experte en mécanique automobile
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Ne vous faites plus avoir sur <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              le marché de l'occasion.
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            La Truffe analyse les annonces, détecte les vices cachés, calcule les frais à prévoir et vous donne la vraie valeur du véhicule en quelques secondes.
          </p>
        </div>
      </div>

      {/* LES 4 PILIERS (CARTES FLOTTANTES) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARTE 1 : AUDIT URL */}
          <Link to="/audit" className="group bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <Search className="w-7 h-7 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Auditer une annonce</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow">
              Collez un lien Leboncoin ou La Centrale. L'IA traque les arnaques et les frais cachés.
            </p>
            <div className="flex items-center text-indigo-600 font-bold text-sm">
              Lancer l'audit <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 2 : MARKETPLACE */}
          <Link to="/marketplace" className="group bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <CarIcon className="w-7 h-7 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Acheter sereinement</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow">
              Parcourez notre catalogue exclusif de véhicules déjà certifiés et audités par La Truffe.
            </p>
            <div className="flex items-center text-blue-600 font-bold text-sm">
              Voir les annonces <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 3 : VENDRE */}
          <Link to="/vendre" className="group bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200 hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <ShieldCheck className="w-7 h-7 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Vendre plus vite</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow">
              Publiez votre voiture. Notre certification IA rassure les acheteurs et justifie votre prix.
            </p>
            <div className="flex items-center text-emerald-600 font-bold text-sm">
              Déposer une annonce <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARTE 4 : COTE AUTO */}
          <Link to="/cote" className="group bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200 hover:-translate-y-2 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 flex flex-col h-full">
            <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <LineChart className="w-7 h-7 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Estimer sa valeur</h3>
            <p className="text-slate-500 text-sm mb-6 flex-grow">
              Obtenez la vraie cote marché instantanée de votre véhicule avec notre simulateur IA.
            </p>
            <div className="flex items-center text-purple-600 font-bold text-sm">
              Calculer la cote <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

      {/* SECTION COMMENT ÇA MARCHE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Le mécanicien le plus incorruptible de France.</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">Notre intelligence artificielle a été entraînée sur des milliers de fiches techniques, pannes récurrentes et données du marché automobile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Analyse du texte</h3>
            <p className="text-slate-600 leading-relaxed">L'IA lit entre les lignes : elle identifie le code moteur précis, détecte les modifications illégales (décata, stage 1) et repère les incohérences.</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
              <Wrench className="w-10 h-10 text-slate-700" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <AlertTriangle className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Diagnostic des pannes</h3>
            <p className="text-slate-600 leading-relaxed">Boîte EDC fragile, chaîne de distribution qui se décale, surconsommation d'huile... L'IA connaît les maladies de chaque moteur.</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Zap className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Calcul du Devis</h3>
            <p className="text-slate-600 leading-relaxed">Elle soustrait les factures récentes et génère un devis prévisionnel précis des frais à prévoir pour vous aider à négocier le prix juste.</p>
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="bg-indigo-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 relative z-10">Prêt à acheter sans vous faire avoir ?</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">Rejoignez des milliers de passionnés et d'acheteurs qui utilisent La Truffe pour sécuriser leurs transactions automobiles.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/audit" className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              Auditer une annonce
            </Link>
            <Link to="/marketplace" className="px-8 py-4 bg-indigo-700 text-white font-bold rounded-xl border border-indigo-500 hover:bg-indigo-800 transition-all">
              Voir la Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
