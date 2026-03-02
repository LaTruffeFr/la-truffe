import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/landing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    credits?: number;
    totalCredits?: number;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        setVerificationResult({ success: false, error: "Aucune session de paiement trouvée" });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) {
          console.error('Verification error:', error);
          setVerificationResult({ success: false, error: error.message });
          toast({
            variant: "destructive",
            title: "Erreur de vérification",
            description: "Impossible de vérifier votre paiement. Contactez le support.",
          });
        } else if (data.success) {
          setVerificationResult(data);
          toast({
            title: "Paiement confirmé !",
            description: data.message || `${data.credits} crédit(s) ajouté(s) à votre compte.`,
          });
        } else {
          setVerificationResult({ success: false, error: data.error || "Paiement non validé" });
        }
      } catch (err) {
        console.error('Verification exception:', err);
        setVerificationResult({ success: false, error: "Erreur lors de la vérification" });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
            La Truffe
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        {isVerifying ? (
          <Card className="max-w-md w-full text-center shadow-lg">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Vérification en cours...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Nous vérifions votre paiement et ajoutons vos crédits.
              </p>
            </CardContent>
          </Card>
        ) : verificationResult?.success ? (
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
                <p className="text-lg font-semibold text-green-700">
                  +{verificationResult.credits} crédit{(verificationResult.credits || 0) > 1 ? 's' : ''} ajouté{(verificationResult.credits || 0) > 1 ? 's' : ''}
                </p>
                {verificationResult.totalCredits !== undefined && (
                  <p className="text-sm text-green-600 mt-1">
                    Solde total : {verificationResult.totalCredits} crédit{verificationResult.totalCredits > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-600">
                  🎉 Vous pouvez désormais lancer vos audits de véhicules et découvrir les meilleures opportunités du marché.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => navigate('/client')}
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
                  Référence : {sessionId.substring(0, 20)}...
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md w-full text-center border-red-200 shadow-lg">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Problème de vérification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                {verificationResult?.error || "Nous n'avons pas pu vérifier votre paiement."}
              </p>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-700">
                  Si vous avez été débité, ne vous inquiétez pas. Contactez notre support avec votre référence de transaction.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => navigate('/contact')}
                >
                  Contacter le support
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
                  Référence : {sessionId.substring(0, 20)}...
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
