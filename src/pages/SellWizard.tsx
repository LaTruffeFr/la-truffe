import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Upload, HelpCircle } from 'lucide-react';

const SellWizard = () => {
  const navigate = useNavigate();
  const [plate, setPlate] = useState('');
  const [makeModel, setMakeModel] = useState('');

  return (
    <div className="min-h-screen bg-background font-display flex justify-center">
      <Helmet><title>Vendre mon véhicule | LaTruffe</title></Helmet>

      <div className="w-full max-w-md bg-card shadow-2xl relative min-h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 pt-6 pb-4 flex items-center justify-between z-10 bg-card/80 backdrop-blur-md sticky top-0">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Détails véhicule</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-accent transition-colors text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </button>
        </header>

        {/* Progress */}
        <div className="px-8 mt-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Étape 2 sur 3</span>
            <span className="text-xs text-muted-foreground font-medium">66%</span>
          </div>
          <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3 rounded-full shadow-[0_0_10px_rgba(13,127,242,0.5)]" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Montrez-nous votre voiture</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ajoutez au moins 3 photos pour aider notre IA à estimer le meilleur prix pour votre véhicule.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="rounded-DEFAULT bg-primary/5 border-2 border-dashed border-primary/30 h-56 flex flex-col items-center justify-center text-center cursor-pointer transition-transform active:scale-95 group relative mb-10 overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 120%, hsl(210 90% 50%) 0%, transparent 60%)' }} />
            <div className="bg-card p-4 rounded-full shadow-lg shadow-primary/10 mb-4 group-hover:scale-110 transition-transform duration-300 z-10">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-primary mb-1 z-10">Appuyez pour ajouter des photos</h3>
            <p className="text-xs text-muted-foreground z-10">ou glissez-déposez ici</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Plate */}
            <div className="relative group">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-4">Plaque d'immatriculation</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-border">
                  <div className="w-6 h-4 bg-blue-700 rounded-sm flex items-center justify-center text-[8px] text-white font-bold tracking-tighter shadow-sm mr-1">EU</div>
                </div>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="AB-123-CD"
                  className="w-full pl-16 pr-4 py-4 bg-accent border-none rounded-full text-lg font-bold tracking-widest text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:bg-card transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Make & Model */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-4">Marque & Modèle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">🚗</span>
                <input
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  placeholder="ex. Tesla Model 3"
                  className="w-full pl-12 pr-4 py-4 bg-accent border-none rounded-full text-base font-medium text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 mt-3 ml-2 overflow-x-auto pb-2 scrollbar-hide">
                {['BMW X5', 'Audi A4', 'VW Golf'].map(s => (
                  <button key={s} onClick={() => setMakeModel(s)} className="flex-shrink-0 px-3 py-1 bg-card border border-border rounded-full text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-24" />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full p-6 glass-panel border-t border-border z-20 flex flex-col gap-3">
          <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-[0_8px_20px_-6px_rgba(13,127,242,0.4)] active:scale-[0.98] transition-all flex items-center justify-center group">
            Continuer vers l'estimation
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigate(-1)} className="w-full py-3 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Retour à l'étape précédente
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellWizard;
