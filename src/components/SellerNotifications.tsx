import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  listing_id: string;
  buyer_email: string;
  buyer_name?: string;
  buyer_phone?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  listing?: {
    title: string;
    price: number;
  };
}

export function SellerNotifications({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    const subscription = supabase
      .channel(`seller-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `seller_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as unknown as Notification, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== (payload.old as any).id)
            );
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === (payload.new as any).id ? payload.new as unknown as Notification : n))
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select(
          `
          id,
          listing_id,
          buyer_email,
          buyer_name,
          buyer_phone,
          message,
          is_read,
          created_at,
          listing:cars(title, price)
        `
        )
        .eq("seller_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme lu",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast({
        title: "Succès",
        description: "Notification supprimée",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin">✨</div>
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Notifications ({unreadCount} non lues)
        </h2>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                !notification.is_read
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm">
                        {notification.listing?.title || "Annonce supprimée"}
                      </h3>
                      {!notification.is_read && (
                        <Badge variant="default">Nouveau</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      <strong>{notification.buyer_name || "Acheteur anonyme"}</strong>{" "}
                      est intéressé
                    </p>

                    {notification.message && (
                      <div className="bg-white border border-gray-200 rounded p-3 mb-3 text-sm">
                        <p className="text-gray-700">{notification.message}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {notification.buyer_email && (
                        <p>📧 {notification.buyer_email}</p>
                      )}
                      {notification.buyer_phone && (
                        <p>📱 {notification.buyer_phone}</p>
                      )}
                      <p>
                        {new Date(notification.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notification.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
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
