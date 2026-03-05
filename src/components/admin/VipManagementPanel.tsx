import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trash2, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RoleUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  role: "vip" | "admin";
}

export function VipManagementPanel() {
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const fetchRoleUsers = async () => {
    setIsLoading(true);
    try {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .in("role", ["vip", "admin"]); // On récupère VIP ET Admins

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) {
        setRoleUsers([]);
        setIsLoading(false);
        return;
      }

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const userList: RoleUser[] = roles.map((role) => {
        const profile = profiles?.find((p) => p.user_id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          email: profile?.email || "Email inconnu",
          created_at: role.created_at,
          role: role.role as "vip" | "admin",
        };
      });

      setRoleUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleUsers();
  }, []);

  const addUserRole = async (targetRole: "vip" | "admin") => {
    if (!newUserEmail.trim()) {
      toast({ title: "Email requis", description: "Veuillez entrer une adresse email", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newUserEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun compte avec cet email. L'utilisateur doit d'abord créer un compte.",
          variant: "destructive",
        });
        return;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id)
        .in("role", ["vip", "admin"])
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Déjà attribué",
          description: `Cet utilisateur est déjà ${existingRole.role.toUpperCase()}`,
          variant: "default",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.user_id, role: targetRole });

      if (insertError) throw insertError;

      toast({ title: "Rôle ajouté ✓", description: `${newUserEmail} est maintenant ${targetRole.toUpperCase()}` });
      setNewUserEmail("");
      fetchRoleUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({ title: "Erreur", description: "Impossible d'ajouter le rôle", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const removeUserRole = async (roleId: string, email: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
      toast({ title: "Accès retiré", description: `${email} a perdu son accès privilégié` });
      fetchRoleUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({ title: "Erreur", description: "Impossible de retirer l'accès", variant: "destructive" });
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Crown className="w-5 h-5 text-indigo-500" />
          Gestion des privilèges (VIP & Admins)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Attribuez des accès illimités (VIP) ou des droits d'administration complets (Admin).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Email de l'utilisateur..."
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => addUserRole("vip")}
              disabled={isAdding}
              className="bg-yellow-500 hover:bg-yellow-600 text-white min-w-[140px]"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> Ajouter VIP
                </>
              )}
            </Button>
            <Button
              onClick={() => addUserRole("admin")}
              disabled={isAdding}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Ajouter Admin
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : roleUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucun utilisateur privilégié pour le moment</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Ajouté le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {u.role === "admin" ? (
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-widest text-[10px] font-black"
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase tracking-widest text-[10px] font-black"
                        >
                          <Crown className="w-3 h-3 mr-1" /> VIP
                        </Badge>
                      )}
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Retirer les accès de {u.email} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cet utilisateur perdra ses privilèges ({u.role.toUpperCase()}) et redeviendra un client
                            standard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeUserRole(u.id, u.email)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirmer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
