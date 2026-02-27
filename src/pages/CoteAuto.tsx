import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Calculator, TrendingUp, Gauge, Info, Activity, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

interface CoteResult {
  prix_bas: number;
  prix_moyen: number;
  prix_haut: number;
  fiabilite_score: number;
  tendance: string;
  explication: string;
}

export default function CoteAuto() {
  const [formData, setFormData] = useState({ marque: "", modele: "", annee: "", kilometrage: "", carburant: "Essence" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoteResult | null>(null);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateCote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("estimate-price", {
        body: {
          marque: formData.marque,
          modele: formData.modele,
          annee: Number(formData.annee),
          kilometrage: Number(formData.kilometrage),
          carburant: formData.carburant
        }
      });

      if (error || !data) throw new Error("Erreur de calcul");
      setResult(data);
    } catch (err) {
      alert("Impossible de calculer la cote pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Header />

      {/* Hero Section */}
      <div className="bg-slate-900 pt-24 pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          La Cote <span className="text-indigo-400">La Truffe</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Découvrez la vraie valeur marchande de votre véhicule grâce à notre IA. Analyse du marché en temps réel.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULAIRE (À gauche) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 h-fit">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Votre Véhicule</h2>
          </div>

          <form onSubmit={calculateCote} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Marque</label>
              <input required name="marque" placeholder="Ex: Peugeot" onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Modèle</label>
              <input required name="modele" placeholder="Ex: 308 1.2 PureTech" onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Année</label>
                <input required type="number" name="annee" placeholder="2018" onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">KM</label>
                <input required type="number" name="kilometrage" placeholder="60000" onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Carburant</label>
              <select name="carburant" onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Electrique">Électrique</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Activity className="w-5 h-5" /> Estimer le prix</>}
            </button>
          </form>
        </div>

        {/* RÉSULTAT (À droite) */}
        <div className="lg:col-span-8">
          {!result && !loading && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Gauge className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-bold text-slate-600">En attente des données</p>
              <p className="text-sm mt-2">Remplissez le formulaire pour obtenir une estimation précise basée sur l'intelligence artificielle.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-600 font-bold animate-pulse">L'IA analyse le marché actuel...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Cartes de Prix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Vente rapide</p>
                  <p className="text-3xl font-black text-slate-800">{result.prix_bas.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-indigo-600 rounded-2xl p-6 shadow-xl text-center transform scale-105 border border-indigo-500 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-2">Cote Exacte</p>
                  <p className="text-4xl font-black text-white">{result.prix_moyen.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Patience requise</p>
                  <p className="text-3xl font-black text-slate-800">{result.prix_haut.toLocaleString('fr-FR')} €</p>
                </div>
              </div>

              {/* Analyse Détaillée */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" /> Analyse de l'Expert
                </h3>
                <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-4 mb-6">
                  "{result.explication}"
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                    <ShieldCheck className={`w-8 h-8 ${result.fiabilite_score >= 7 ? 'text-green-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Indice de fiabilité</p>
                      <p className="font-black text-slate-800 text-lg">{result.fiabilite_score} / 10</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Tendance marché</p>
                      <p className="font-black text-slate-800 text-lg">{result.tendance}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
