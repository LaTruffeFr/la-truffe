import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { 
  Search, SlidersHorizontal, Gauge, Calendar, 
  ShieldCheck, ShieldAlert, Car as CarIcon, 
  ChevronRight, TrendingUp, X 
} from "lucide-react";

interface ListingData {
  id: string;
  marque: string;
  modele: string;
  prix: number;
  kilometrage: number;
  annee: number;
  image_url: string;
  score_ia: number;
  ai_tags?: string[];
  carburant?: string;
}

export default function Marketplace() {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMileage, setMaxMileage] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("id, marque, modele, prix, kilometrage, annee, image_url, score_ia, ai_tags, carburant")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) console.error("Erreur de récupération :", error);
      else setListings((data as ListingData[]) || []);
      setLoading(false);
    };

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const title = `${l.marque} ${l.modele}`.toLowerCase();
      const matchSearch = title.includes(searchTerm.toLowerCase());
      const matchMinPrice = minPrice ? l.prix >= Number(minPrice) : true;
      const matchMaxPrice = maxPrice ? l.prix <= Number(maxPrice) : true;
      const matchMaxMileage = maxMileage ? (l.kilometrage || 0) <= Number(maxMileage) : true;
      return matchSearch && matchMinPrice && matchMaxPrice && matchMaxMileage;
    });
  }, [listings, searchTerm, minPrice, maxPrice, maxMileage]);

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
    <div className="min-h-screen bg-background font-sans pb-20">
      
      <Header />

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-b from-primary/5 to-background pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" /> 100% des annonces auditées par l'IA
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Trouvez la perle rare.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Sans les vices cachés.
            </span>
          </h1>
          
          <div className="max-w-2xl mx-auto bg-card p-2 rounded-2xl shadow-2xl border border-border flex items-center gap-2">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                placeholder="Quelle voiture cherchez-vous ? (ex: Golf 8 GTI)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-4 py-3 text-lg text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-bold transition-colors">
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTRES */}
          <div className="w-full lg:w-1/4">
            <div className="bg-card backdrop-blur-xl border border-border shadow-xl dark:shadow-none rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Filtres affinés</h2>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                    <X className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" /> Budget (€)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium text-foreground"
                    />
                    <span className="text-muted-foreground font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" /> Kilométrage Max
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 80000"
                    value={maxMileage}
                    onChange={(e) => setMaxMileage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GRILLE RÉSULTATS */}
          <div className="w-full lg:w-3/4 pt-4 lg:pt-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {filteredListings.length} {filteredListings.length > 1 ? 'Annonces disponibles' : 'Annonce disponible'}
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-card rounded-2xl border border-dashed border-border p-16 text-center">
                <CarIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">Aucun véhicule ne correspond</h3>
                <p className="text-muted-foreground mt-2">Élargissez vos critères pour voir plus de résultats.</p>
                <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition">
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredListings.map((listing) => {
                  const scoreStyle = getScoreDesign(listing.score_ia || 0);
                  const title = `${listing.marque} ${listing.modele}`;
                  
                  return (
                    <Link 
                      key={listing.id} 
                      to={`/annonce/${listing.id}`}
                      className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl border border-border transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="relative h-56 w-full bg-muted overflow-hidden">
                        <img 
                          src={listing.image_url || "/placeholder.svg"} 
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {listing.score_ia && (
                          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold shadow-lg backdrop-blur-md ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}`}>
                            {scoreStyle.icon}
                            <span>{listing.score_ia}/100</span>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-extrabold text-white line-clamp-1 drop-shadow-md">
                            {title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {listing.annee}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-4 h-4" />
                              {(listing.kilometrage || 0).toLocaleString('fr-FR')} km
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prix demandé</span>
                            <span className="text-2xl font-black text-foreground">
                              {listing.prix.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                          
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground transition-colors">
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