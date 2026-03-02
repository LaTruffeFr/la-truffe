import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
          <p className="text-sm text-slate-600 font-medium">
            Nous utilisons des cookies essentiels pour le bon fonctionnement du site. Aucun cookie publicitaire n'est utilisé.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={reject} className="font-bold rounded-xl border-slate-200 text-slate-600">
            Refuser
          </Button>
          <Button size="sm" onClick={accept} className="font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
