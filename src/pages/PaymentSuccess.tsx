import { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { Footer } from '@/components/landing';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      toast({
        title: "Paiement confirmé !",
        description: "Vos crédits d'audit ont été ajoutés à votre compte.",
      });
    }
  }, [sessionId, toast]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-logo font-bold text-2xl tracking-tight text-slate-900">
            La Truffe
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-green-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Paiement réussi !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600">
              Merci pour votre achat. Vos crédits d'audit sont maintenant disponibles sur votre compte.
            </p>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-700 font-medium">
                🎉 Vous pouvez désormais lancer vos audits de véhicules et découvrir les meilleures opportunités du marché.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={() => navigate('/client-dashboard')}
              >
                Accéder à mes audits
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full gap-2"
                onClick={() => navigate('/')}
              >
                Retour à l'accueil
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-slate-400 pt-4">
                Référence de transaction : {sessionId.substring(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
