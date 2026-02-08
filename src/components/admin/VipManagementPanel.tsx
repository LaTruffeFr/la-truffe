import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Trash2, UserPlus, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface VipUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

export function VipManagementPanel() {
  const [vipUsers, setVipUsers] = useState<VipUser[]>([]);
  const [newVipEmail, setNewVipEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const fetchVipUsers = async () => {
    setIsLoading(true);
    try {
      // Get all VIP roles with user info from profiles
      const { data: vipRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, created_at')
        .eq('role', 'vip');

      if (rolesError) throw rolesError;

      if (!vipRoles || vipRoles.length === 0) {
        setVipUsers([]);
        return;
      }

      // Get emails from profiles
      const userIds = vipRoles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const vipList: VipUser[] = vipRoles.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          email: profile?.email || 'Email inconnu',
          created_at: role.created_at,
        };
      });

      setVipUsers(vipList);
    } catch (error) {
      console.error('Error fetching VIP users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs VIP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVipUsers();
  }, []);

  const addVipUser = async () => {
    if (!newVipEmail.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer une adresse email",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newVipEmail.trim().toLowerCase())
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

      // Check if already VIP
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('role', 'vip')
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Déjà VIP",
          description: "Cet utilisateur est déjà VIP",
          variant: "default",
        });
        return;
      }

      // Add VIP role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: 'vip',
        });

      if (insertError) throw insertError;

      toast({
        title: "VIP ajouté ✓",
        description: `${newVipEmail} a maintenant un accès VIP illimité`,
      });

      setNewVipEmail('');
      fetchVipUsers();
    } catch (error) {
      console.error('Error adding VIP:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'utilisateur VIP",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeVipUser = async (roleId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "VIP retiré",
        description: `${email} n'a plus l'accès VIP`,
      });

      fetchVipUsers();
    } catch (error) {
      console.error('Error removing VIP:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'accès VIP",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Crown className="w-5 h-5 text-yellow-500" />
          Gestion des comptes VIP
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Les utilisateurs VIP ont des crédits illimités et un accès complet aux fonctionnalités
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add VIP form */}
        <div className="flex gap-3">
          <Input
            placeholder="Email de l'utilisateur à ajouter..."
            value={newVipEmail}
            onChange={(e) => setNewVipEmail(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addVipUser()}
          />
          <Button 
            onClick={addVipUser} 
            disabled={isAdding}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter VIP
              </>
            )}
          </Button>
        </div>

        {/* VIP users list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : vipUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucun utilisateur VIP pour le moment</p>
            <p className="text-sm">Ajoutez un email ci-dessus pour donner l'accès VIP</p>
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
              {vipUsers.map((vip) => (
                <TableRow key={vip.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                      {vip.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(vip.created_at).toLocaleDateString('fr-FR')}
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
                          <AlertDialogTitle>Retirer l'accès VIP ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {vip.email} n'aura plus accès aux fonctionnalités VIP et devra payer pour utiliser le service.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removeVipUser(vip.id, vip.email)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Retirer VIP
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