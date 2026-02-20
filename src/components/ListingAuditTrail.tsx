import { useEffect, useState } from "react";
import { History, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  id: string;
  listing_id: string;
  action: string;
  change_description: string;
  created_at: string;
  modified_by: string;
  previous_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export function ListingAuditTrail({ listingId }: { listingId: string }) {
  const { toast } = useToast();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();

    // Subscribe to changes
    const subscription = supabase
      .channel(`audit-log:${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listing_audit_log",
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          fetchAuditLog();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [listingId]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("listing_audit_log")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAuditLog((data || []) as AuditEntry[]);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "✨ Créée",
      updated: "✏️ Modifiée",
      published: "📢 Publiée",
      unpublished: "🔒 Dépubliée",
      promoted: "⭐ Promue",
      deleted: "🗑️ Supprimée",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-50 border-green-200",
      updated: "bg-blue-50 border-blue-200",
      published: "bg-purple-50 border-purple-200",
      unpublished: "bg-yellow-50 border-yellow-200",
      promoted: "bg-orange-50 border-orange-200",
      deleted: "bg-red-50 border-red-200",
    };
    return colors[action] || "bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin">⏳</div>
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5" />
        <h3 className="font-semibold">Historique des modifications</h3>
      </div>

      {auditLog.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <History className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucune modification enregistrée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {auditLog.map((entry, index) => (
            <Card
              key={entry.id}
              className={`border transition-colors ${getActionColor(entry.action)}`}
            >
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {getActionLabel(entry.action)}
                      </p>
                      {entry.change_description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {entry.change_description}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {(entry.previous_values || entry.new_values) && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(
                            expandedId === entry.id ? null : entry.id
                          )
                        }
                        className="text-xs"
                      >
                        {expandedId === entry.id ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Masquer les détails
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Voir les détails
                          </>
                        )}
                      </Button>

                      {expandedId === entry.id && (
                        <div className="mt-3 space-y-2 bg-white rounded p-3 text-xs border border-gray-200">
                          {entry.previous_values && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-2">
                                Avant :
                              </p>
                              <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(
                                  entry.previous_values,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          )}

                          {entry.new_values && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-2">
                                Après :
                              </p>
                              <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(entry.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
