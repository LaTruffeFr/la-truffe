import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, Gauge, Calendar, ShieldCheck, ShieldAlert } from "lucide-react";

// Définition du type de nos annonces
interface Car {
  id: string;
  title: string;
  price: number;
  mileage: number;
  year: number;
  image_url: string;
  ai_score: number;
}

export default function Marketplace() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMileage, setMaxMileage] = useState("");

  // Récupération des données depuis Supabase
  useEffect(() => {
    const fetchCars = async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("id, title, price, mileage, year, image_url, ai_score")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération :", error);
      } else {
        setCars(data || []);
      }
      setLoading(false);
    };

    fetchCars();
  }, []);

  // Logique de filtrage dynamique (se met à jour à chaque frappe)
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchSearch = car.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMinPrice = minPrice ? car.price >= Number(minPrice) : true;
      const matchMaxPrice = maxPrice ? car.price <= Number(maxPrice) : true;
      const matchMaxMileage = maxMileage ? car.mileage <= Number(maxMileage) : true;

      return matchSearch && matchMinPrice && matchMaxPrice && matchMaxMileage;
    });
  }, [cars, searchTerm, minPrice, maxPrice, maxMileage]);

  // Fonction pour définir la couleur du badge de score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Véhicules audités par La Truffe</h1>
          <p className="text-slate-500 mt-2">Trouvez votre prochaine voiture, sans les mauvaises surprises.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* BARRE LATÉRALE : FILTRES */}
          <div className="w-full md:w-1/4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <SlidersHorizontal className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-800">Filtres</h2>
            </div>

            <div className="space-y-5">
              {/* Recherche Marque/Modèle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marque ou Modèle</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ex: BMW M4..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix (€)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Kilométrage Max */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kilométrage Max</label>
                <input
                  type="number"
                  placeholder="ex: 100000"
                  value={maxMileage}
                  onChange={(e) => setMaxMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Bouton Réinitialiser */}
              <button 
                onClick={() => { setSearchTerm(""); setMinPrice(""); setMaxPrice(""); setMaxMileage(""); }}
                className="w-full mt-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* GRILLE DE RÉSULTATS */}
          <div className="w-full md:w-3/4">
            {/* Compteur de résultats */}
            <div className="mb-4 text-sm text-slate-500 font-medium">
              {filteredCars.length} véhicule{filteredCars.length > 1 ? 's' : ''} trouvé{filteredCars.length > 1 ? 's' : ''}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800">Aucune voiture trouvée</h3>
                <p className="text-slate-500 mt-2">Essayez de modifier vos filtres de recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <Link 
                    key={car.id} 
                    to={`/listing/${car.id}`} /* VÉRIFIE QUE CE LIEN CORRESPOND À TON ROUTING */
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                      <img 
                        src={car.image_url || "/placeholder.svg"} 
                        alt={car.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Badge IA Absolu */}
                      {car.ai_score && (
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 backdrop-blur-md ${getScoreColor(car.ai_score)}`}>
                          {car.ai_score >= 80 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          Score IA : {car.ai_score}/100
                        </div>
                      )}
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                        {car.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {car.year}
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="w-4 h-4 text-slate-400" />
                          {car.mileage.toLocaleString('fr-FR')} km
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xl font-extrabold text-slate-900">
                          {car.price.toLocaleString('fr-FR')} €
                        </span>
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          Voir l'audit
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
