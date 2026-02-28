import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header"; // ⚠️ Vérifie que le chemin est correct
import { 
  ArrowLeft, Calendar, Gauge, Phone, ShieldCheck, 
  ShieldAlert, Wrench, Receipt, AlertTriangle, CheckCircle2 
} from "lucide-react";

interface Argument {
  titre: string;
  desc: string;
}

interface DevisItem {
  piece: string;
  cout_euros: number;
}

interface CarDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  mileage: number;
  year: number;
  image_url: string;
  seller_contact: string;
  ai_score: number;
  ai_avis: string;
  ai_tags: string[];
  ai_arguments?: Argument[]; 
  ai_devis?: DevisItem[];   
}

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur de récupération :", error);
      } else {
        setCar(data as unknown as CarDetails);
      }
      setLoading(false);
    };

    fetchCarDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Annonce introuvable</h2>
        <Link to="/" className="mt-4 text-indigo-600 hover:underline font-medium">
          Retour à la marketplace
        </Link>
      </div>
    );
  }

  const getScoreDesign = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50", icon: <ShieldCheck className="w-8 h-8 text-emerald-600" /> };
    if (score >= 60) return { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50", icon: <ShieldAlert className="w-8 h-8 text-amber-600" /> };
    return { bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-200", lightBg: "bg-rose-50", icon: <AlertTriangle className="w-8 h-8 text-rose-600" /> };
  };

  const scoreStyle = getScoreDesign(car.ai_score);
  const totalDevis = car.ai_devis?.reduce((acc, curr) => acc + curr.cout_euros, 0) || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux annonces
        </Link>

        {/* SECTION SUPÉRIEURE : L'Annonce */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Image */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-200">
            <div className="relative h-96 md:h-[500px] w-full bg-slate-900 rounded-xl overflow-hidden">
              <img 
                src={car.image_url || "/placeholder.svg"} 
                alt={car.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Fiche Résumé & Contact */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">
                {car.title}
              </h1>
              <div className="text-4xl font-black text-indigo-600 mb-6 pb-6 border-b border-slate-100">
                {car.price.toLocaleString('fr-FR')} €
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Année</p>
                    <p className="font-bold text-slate-800">{car.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Gauge className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Kilométrage</p>
                    <p className="font-bold text-slate-800">{car.mileage.toLocaleString('fr-FR')} km</p>
                  </div>
                </div>
              </div>

              {/* Bouton Contact */}
              <a 
                href={`tel:${car.seller_contact}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition shadow-lg"
              >
                <Phone className="w-5 h-5" /> Contacter le vendeur
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">
                Numéro : {car.seller_contact || "Non renseigné"}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION IA : LE RAPPORT D'EXPERTISE */}
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-900">Rapport d'Expertise La Truffe</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne Principale (Avis & Playbook) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. L'Avis Général */}
            <div className={`rounded-2xl p-8 border ${scoreStyle.border} ${scoreStyle.lightBg}`}>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-sm">
                  <span className={`text-3xl font-black ${scoreStyle.text}`}>
                    {car.ai_score}
                  </span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 ${scoreStyle.text}`}>Score de Confiance</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {car.ai_tags?.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm border text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">L'avis du Cerveau Hybride</h4>
                <p className="text-slate-700 leading-relaxed font-medium italic">
                  "{car.ai_avis}"
                </p>
              </div>
            </div>

            {/* 2. Le Playbook de Négociation */}
            {car.ai_arguments && car.ai_arguments.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" /> Playbook de Négociation
                </h3>
                <div className="space-y-6">
                  {car.ai_arguments.map((arg, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{arg.titre}</h4>
                        <p className="text-slate-600 leading-relaxed">{arg.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Description originale */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Description du vendeur</h3>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                {car.description || "Aucune description fournie par le vendeur."}
              </p>
            </div>
          </div>

          {/* Colonne Latérale (Le Devis) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
                <Receipt className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-bold">Devis Estimé (Frais à prévoir)</h3>
              </div>
              
              <div className="p-6">
                {car.ai_devis && car.ai_devis.length > 0 ? (
                  <>
                    <ul className="space-y-4 mb-6">
                      {car.ai_devis.map((item, index) => (
                        <li key={index} className="flex justify-between items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                          <span className="text-sm font-medium text-slate-600 pr-4">{item.piece}</span>
                          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{item.cout_euros} €</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500 uppercase">Total Estimé</span>
                      <span className="text-2xl font-black text-indigo-600">{totalDevis} €</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Aucun frais majeur à prévoir selon l'IA.</p>
                  </div>
                )}
                
                <p className="text-xs text-slate-400 text-center mt-6">
                  * Ce devis est une estimation générée par IA et ne remplace pas l'avis d'un mécanicien professionnel sur place.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
