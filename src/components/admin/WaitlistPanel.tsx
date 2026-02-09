import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Loader2, Mail, UserCheck } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  vip_approved: boolean;
}

export function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('beta_waitlist')
      .select('id, email, created_at, vip_approved')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger la waitlist', variant: 'destructive' });
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const toggleVip = async (entry: WaitlistEntry) => {
    setTogglingId(entry.id);
    const newValue = !entry.vip_approved;

    const { error } = await supabase
      .from('beta_waitlist')
      .update({ vip_approved: newValue })
      .eq('id', entry.id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut', variant: 'destructive' });
    } else {
      toast({
        title: newValue ? 'VIP pré-approuvé ✓' : 'Approbation retirée',
        description: newValue
          ? `${entry.email} recevra le rôle VIP à la création de son compte`
          : `${entry.email} ne sera plus pré-approuvé`,
      });
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, vip_approved: newValue } : e));
    }
    setTogglingId(null);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Mail className="w-5 h-5 text-blue-500" />
          Liste d'attente Bêta
          <Badge variant="secondary" className="ml-2">{entries.length}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pré-approuvez des emails pour qu'ils reçoivent automatiquement le rôle VIP à l'inscription
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucune inscription en liste d'attente</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {entry.vip_approved ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200" variant="outline">
                        <Crown className="w-3 h-3 mr-1" /> VIP pré-approuvé
                      </Badge>
                    ) : (
                      <Badge variant="secondary">En attente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={entry.vip_approved ? 'outline' : 'default'}
                      className={entry.vip_approved ? '' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}
                      disabled={togglingId === entry.id}
                      onClick={() => toggleVip(entry)}
                    >
                      {togglingId === entry.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : entry.vip_approved ? (
                        'Retirer'
                      ) : (
                        <><UserCheck className="w-4 h-4 mr-1" /> Approuver VIP</>
                      )}
                    </Button>
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
