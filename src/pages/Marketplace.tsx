import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header"; // ⚠️ Vérifie que le chemin vers ton Header est correct
import { 
  Search, SlidersHorizontal, Gauge, Calendar, 
  ShieldCheck, ShieldAlert, Car as CarIcon, 
  ChevronRight, TrendingUp, X 
} from "lucide-react";

interface CarData {
  id: string;
  title: string;
  price: number;
  mileage: number;
  year: number;
  image_url: string;
  ai_score: number;
  ai_tags?: string[];
}

export default function Marketplace() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMileage, setMaxMileage] = useState("");

  useEffect(() => {
    const fetchCars = async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("id, title, price, mileage, year, image_url, ai_score, ai_tags")
        .order("created_at", { ascending: false });

      if (error) console.error("Erreur de récupération :", error);
      else setCars(data || []);
      setLoading(false);
    };

    fetchCars();
  }, []);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchSearch = car.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMinPrice = minPrice ? car.price >= Number(minPrice) : true;
      const matchMaxPrice = maxPrice ? car.price <= Number(maxPrice) : true;
      const matchMaxMileage = maxMileage ? car.mileage <= Number(maxMileage) : true;
      return matchSearch && matchMinPrice && matchMaxPrice && matchMaxMileage;
    });
  }, [cars, searchTerm, minPrice, maxPrice, maxMileage]);

  const clearFilters = () => {
    setSearchTerm(""); setMinPrice(""); setMaxPrice(""); setMaxMileage("");
  };

  const hasActiveFilters = searchTerm || minPrice || maxPrice || maxMileage;

  const getScoreDesign = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", icon: <ShieldCheck className="w-4 h-4" /> };
    if (score >= 60) return { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", icon: <ShieldAlert className="w-4 h-4" /> };
    return { bg: "bg-rose-500", text: "text-white", border: "border-rose-600", icon: <ShieldAlert className="w-4 h-4" /> };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      
      {/* HEADER DU SITE */}
      <Header />

      {/* HERO SECTION PREMIUM */}
      <div className="relative bg-slate-900 pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium mb-6 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" /> 100% des annonces auditées par l'IA
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Trouvez la perle rare.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Sans les vices cachés.
            </span>
          </h1>
          
          <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-6 h-6 text-slate-400" />
              <input
                type="text"
                placeholder="Quelle voiture cherchez-vous ? (ex: Golf 8 GTI)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-4 py-3 text-lg text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors">
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTRES */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800">Filtres affinés</h2>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition">
                    <X className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" /> Budget (€)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                    <span className="text-slate-300 font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-400" /> Kilométrage Max
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 80000"
                    value={maxMileage}
                    onChange={(e) => setMaxMileage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GRILLE RÉSULTATS */}
          <div className="w-full lg:w-3/4 pt-4 lg:pt-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {filteredCars.length} {filteredCars.length > 1 ? 'Annonces disponibles' : 'Annonce disponible'}
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                <CarIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Aucun véhicule ne correspond</h3>
                <p className="text-slate-500 mt-2">Élargissez vos critères pour voir plus de résultats.</p>
                <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition">
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCars.map((car) => {
                  const scoreStyle = getScoreDesign(car.ai_score);
                  
                  return (
                    <Link 
                      key={car.id} 
                      to={`/listing/${car.id}`}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="relative h-56 w-full bg-slate-900 overflow-hidden">
                        <img 
                          src={car.image_url || "/placeholder.svg"} 
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        
                        {car.ai_score && (
                          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold shadow-lg backdrop-blur-md ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}`}>
                            {scoreStyle.icon}
                            <span>{car.ai_score}/100</span>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-extrabold text-white line-clamp-1 drop-shadow-md">
                            {car.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow bg-white">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {car.year}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-4 h-4 text-slate-400" />
                              {car.mileage.toLocaleString('fr-FR')} km
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prix demandé</span>
                            <span className="text-2xl font-black text-slate-900">
                              {car.price.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                          
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white text-slate-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
