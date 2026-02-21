import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { 
  Car, Calendar, Gauge, ShieldCheck, Sparkles, 
  MapPin, ChevronRight, Loader2, Phone, Mail 
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      // On récupère uniquement les annonces des utilisateurs (is_user_listing = true)
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_user_listing', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des annonces:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* TITRE DE LA SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Véhicules Certifiés <span className="text-green-600">LaTruffe</span>
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Achetez en toute confiance. Chaque véhicule a été analysé et noté par notre Intelligence Artificielle.
            </p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm">
                {listings.length} Véhicules disponibles
             </Badge>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          </div>
        )}

        {/* EMPTY STATE (Si aucune annonce) */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Aucune annonce pour le moment</h3>
            <p className="text-slate-500 mb-6">Soyez le premier à vendre votre voiture certifiée !</p>
            <Button onClick={() => window.location.href = '/vendre'} className="bg-green-600 hover:bg-green-700">
              Vendre ma voiture
            </Button>
          </div>
        )}

        {/* GRILLE DES ANNONCES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((car) => (
            <Card key={car.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full cursor-pointer" onClick={() => navigate(`/annonce/${car.id}`)}>
              
              {/* IMAGE + BADGES */}
              <div className="relative h-56 overflow-hidden bg-slate-200">
                {car.image_url ? (
                  <img 
                    src={car.image_url} 
                    alt={car.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <Car className="w-12 h-12" />
                  </div>
                )}
                
                {/* Score Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-sm px-3 py-1.5 rounded-lg flex flex-col items-center border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                  <span className={`text-xl font-black ${car.ai_score >= 75 ? 'text-green-600' : 'text-amber-500'}`}>
                    {car.ai_score || '?'}
                  </span>
                </div>

                {/* AI Verified Badge */}
                <div className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <ShieldCheck className="w-3 h-3" /> VERIFIÉ IA
                </div>
              </div>

              {/* CONTENU */}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{car.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {car.year}</span>
                  <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {car.mileage?.toLocaleString()} km</span>
                </div>
              </CardHeader>

              <CardContent className="py-2 flex-grow">
                {/* Tags IA */}
                <div className="flex flex-wrap gap-2 mb-4">
                   {car.ai_tags && car.ai_tags.slice(0, 3).map((tag: string) => (
                     <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                       {tag}
                     </span>
                   ))}
                </div>

                {/* Avis IA (Extrait) */}
                {car.ai_avis && (
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-blue-800">L'avis de l'Expert</span>
                    </div>
                    <p className="text-xs text-slate-600 italic line-clamp-2">
                      "{car.ai_avis}"
                    </p>
                  </div>
                )}
              </CardContent>

              <Separator />

              <CardFooter className="pt-4 pb-4 px-6 flex items-center justify-between bg-white">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Prix demandé</p>
                  <p className="text-2xl font-black text-green-700">{car.price?.toLocaleString()} €</p>
                </div>
                
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                  onClick={(e) => { e.stopPropagation(); navigate(`/annonce/${car.id}`); }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}