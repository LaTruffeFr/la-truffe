import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Settings, CreditCard, LogOut, 
  User, Download, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { useAuth } from '@/hooks/useAuth';

const Transactions = () => {
  const navigate = useNavigate();
  const { user, signOut, userEmail } = useAuth();
  
  const displayEmail = userEmail || user?.email || "client@latruffe.com";
  const initials = displayEmail.substring(0, 2).toUpperCase();

  // Données factices pour l'exemple
  const transactions = [
    { id: "TRX-9821", date: "15 Jan 2024", pack: "Pack Chasseur (3 Audits)", amount: "53.97 €", status: "completed", invoice: "#INV-001" },
    { id: "TRX-9822", date: "02 Dec 2023", pack: "Pack Duo (2 Audits)", amount: "39.98 €", status: "completed", invoice: "#INV-002" },
    { id: "TRX-9823", date: "10 Nov 2023", pack: "Audit Unitaire", amount: "29.99 €", status: "failed", invoice: "-" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col font-sans text-foreground">
      
      {/* HEADER */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-logo font-bold text-2xl tracking-tight text-foreground">
            La Truffe
          </Link>
          <div className="flex items-center gap-3">
             <div className="text-sm text-right hidden sm:block">
                <div className="font-bold">{displayEmail}</div>
                <div className="text-xs text-muted-foreground">Individuel</div>
             </div>
             <Avatar className="h-9 w-9 border border-border bg-card">
               <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">{initials}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR */}
          <aside className="lg:col-span-3 space-y-6">
            <Card className="border-border shadow-sm bg-card overflow-hidden">
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-sm truncate px-2">{displayEmail}</div>
              </div>
              <nav className="p-2 space-y-1">
                <Button variant="ghost" onClick={() => navigate('/client-dashboard')} className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted h-10">
                  <LayoutDashboard className="w-4 h-4 mr-3" /> Mes rapports
                </Button>
                <Button variant="ghost" onClick={() => navigate('/settings')} className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted h-10">
                  <Settings className="w-4 h-4 mr-3" /> Paramètres
                </Button>
                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5 font-semibold h-10">
                  <CreditCard className="w-4 h-4 mr-3" /> Transactions
                </Button>
                <Separator className="my-2" />
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10">
                  <LogOut className="w-4 h-4 mr-3" /> Déconnexion
                </Button>
              </nav>
            </Card>
          </aside>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Historique des transactions</h2>
              <Button onClick={() => navigate('/pricing')} className="bg-primary hover:bg-primary/90">Nouvel achat</Button>
            </div>

            <Card className="border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Montant</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Facture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{trx.date}</td>
                        <td className="px-6 py-4 text-muted-foreground">{trx.pack}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{trx.amount}</td>
                        <td className="px-6 py-4">
                          {trx.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 shadow-none font-medium">
                              <AlertCircle className="w-3 h-3 mr-1" /> Échoué
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {trx.status === 'completed' && (
                            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary">
                              <Download className="w-4 h-4 mr-2" /> PDF
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
