import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const navigate = useNavigate();

  const handleLaunchAudit = () => {
    onClose();
    navigate('/audit');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-0 overflow-hidden data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:duration-500">
        {/* Decorative top bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500" />
        
        <div className="p-8 text-center space-y-6">
          <div className="text-6xl">🎁</div>
          
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
              Félicitations et Bienvenue ! 🎉
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600 leading-relaxed">
              Votre compte a été créé avec succès. Pour vous souhaiter la bienvenue sur <strong className="text-indigo-600">La Truffe</strong>, nous vous offrons <strong className="text-emerald-600">1 crédit d'expertise gratuit</strong> !
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-emerald-600 font-black text-3xl">
              <span>🎫</span> 1 Crédit Offert
            </div>
            <p className="text-sm text-slate-500 mt-2">Collez n'importe quelle annonce auto et obtenez un rapport d'expertise complet.</p>
          </div>

          <Button
            onClick={handleLaunchAudit}
            className="w-full h-14 text-lg font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            Lancer mon premier audit 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
