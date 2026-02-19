import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Pointer, Phone, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ListingWithStats {
  id: string;
  title: string;
  price: number;
  created_at: string;
  stats: {
    view_count: number;
    click_count: number;
    contact_count: number;
    favorite_count: number;
    days_active: number;
  };
}

export function ListingStatistics({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListingsWithStats();

    // Subscribe to stats updates
    const subscription = supabase
      .channel(`listing-stats:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listing_stats",
        },
        () => {
          fetchListingsWithStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchListingsWithStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(
          `
          id,
          title,
          price,
          created_at,
          stats:listing_stats(
            view_count,
            click_count,
            contact_count,
            favorite_count,
            days_active
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include stats
      const listingsWithStats = (data || []).map((listing: any) => ({
        ...listing,
        stats: listing.stats?.[0] || {
          view_count: 0,
          click_count: 0,
          contact_count: 0,
          favorite_count: 0,
          days_active: 0,
        },
      }));

      setListings(listingsWithStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendBadge = (views: number, contacts: number) => {
    const conversionRate = contacts > 0 ? (contacts / views) * 100 : 0;
    if (conversionRate > 5) return <Badge className="bg-green-500">Excellent</Badge>;
    if (conversionRate > 2) return <Badge className="bg-blue-500">Bon</Badge>;
    if (views > 0) return <Badge variant="outline">Moyen</Badge>;
    return <Badge variant="secondary">Nouveau</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin">📊</div>
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Statistiques des annonces
        </h2>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">Aucune annonce trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{listing.title}</CardTitle>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      €{listing.price.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {getTrendBadge(listing.stats.view_count, listing.stats.contact_count)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Eye className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="font-semibold text-lg">{listing.stats.view_count}</p>
                    <p className="text-xs text-gray-500">Vues</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Pointer className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="font-semibold text-lg">{listing.stats.click_count}</p>
                    <p className="text-xs text-gray-500">Clics</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="font-semibold text-lg">{listing.stats.contact_count}</p>
                    <p className="text-xs text-gray-500">Contacts</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="font-semibold text-lg">{listing.stats.favorite_count}</p>
                    <p className="text-xs text-gray-500">Favoris</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-5 h-5 text-orange-500">📅</div>
                    </div>
                    <p className="font-semibold text-lg">{listing.stats.days_active}</p>
                    <p className="text-xs text-gray-500">Jours</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Taux de conversion:</span>
                      <span className="font-semibold">
                        {listing.stats.view_count > 0
                          ? (
                              ((listing.stats.contact_count / listing.stats.view_count) * 100).toFixed(
                                1
                              ) + "%"
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Créée il y a:</span>
                      <span>
                        {Math.floor(
                          (Date.now() - new Date(listing.created_at).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        jours
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
