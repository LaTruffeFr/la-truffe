import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { X, Check, RefreshCw, Calculator, Shield } from 'lucide-react';

interface Step {
  label: string;
  icon: React.ReactNode;
  status: 'done' | 'active' | 'pending';
}

const AnalysisLoading = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/market-report'), 800);
          return 100;
        }
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (progress < 30) setCurrentStep(0);
    else if (progress < 60) setCurrentStep(1);
    else if (progress < 85) setCurrentStep(2);
    else setCurrentStep(3);
  }, [progress]);

  const steps: Step[] = [
    { label: 'Scraping des données', icon: <RefreshCw className="w-4 h-4" />, status: currentStep > 0 ? 'done' : currentStep === 0 ? 'active' : 'pending' },
    { label: 'Analyse des prix', icon: <RefreshCw className="w-4 h-4" />, status: currentStep > 1 ? 'done' : currentStep === 1 ? 'active' : 'pending' },
    { label: 'Calcul des scores', icon: <Calculator className="w-4 h-4" />, status: currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : 'pending' },
    { label: 'Finalisation du rapport', icon: <Shield className="w-4 h-4" />, status: currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : 'pending' },
  ];

  return (
    <div className="min-h-screen bg-background font-display flex justify-center items-center">
      <Helmet><title>Analyse en cours... | LaTruffe</title></Helmet>

      <div className="w-full max-w-md h-screen bg-card shadow-2xl relative flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 py-4 flex justify-between items-center z-10 mt-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
          <div className="text-xs font-semibold tracking-wider uppercase text-primary/80">LaTruffe AI</div>
          <div className="w-10" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12 relative z-10">
          {/* Scanner Visual */}
          <div className="relative w-64 h-48 mb-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
            {/* Progress Ring */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1" strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress / 100)}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Car Icon */}
            <div className="relative z-10 w-40 h-24 overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full text-foreground" fill="none" stroke="currentColor" strokeWidth="0.8" viewBox="0 0 24 24">
                <path d="M19 17H21C21.5523 17 22 16.5523 22 16V13.5C22 12 22 11 20.5 10.5L18.5 9.5L16.5 4.5C16.146 3.615 15.65 3 13.5 3H10.5C8.35 3 7.854 3.615 7.5 4.5L5.5 9.5L3.5 10.5C2 11 2 12 2 13.5V16C2 16.5523 2.44772 17 3 17H5M19 17V19.5C19 20.3284 18.3284 21 17.5 21H16.5C15.6716 21 15 20.3284 15 19.5V17M19 17H5M5 17V19.5C5 20.3284 5.67157 21 6.5 21H7.5C8.32843 21 9 20.3284 9 19.5V17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Scanning beam */}
              <div className="absolute inset-0 w-full h-full scanner-beam animate-scan opacity-60 mix-blend-overlay" />
            </div>
            {/* Live badge */}
            <div className="absolute top-0 right-8 bg-card shadow-lg rounded-DEFAULT px-3 py-1.5 flex items-center gap-2 transform translate-x-4 -translate-y-2 border border-border animate-bounce">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground">Live</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Analyse du marché</h1>
            <p className="text-muted-foreground text-sm">L'IA LaTruffe compare 12,403 véhicules similaires en temps réel.</p>
          </div>

          {/* Steps */}
          <div className="w-full space-y-4 max-w-xs mx-auto">
            {steps.map((step, i) => (
              <div key={i} className={`group flex items-center gap-4 transition-all duration-300 ${
                step.status === 'active'
                  ? 'bg-primary/5 rounded-lg p-3 border border-primary/20 shadow-sm shadow-primary/5 transform scale-105'
                  : step.status === 'done'
                  ? 'p-1'
                  : 'p-1 opacity-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative ${
                  step.status === 'done' ? 'bg-green-500/10' :
                  step.status === 'active' ? 'bg-primary' :
                  'border-2 border-border'
                }`}>
                  {step.status === 'active' && <span className="absolute w-full h-full rounded-full bg-primary animate-ping opacity-20" />}
                  {step.status === 'done' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : step.status === 'active' ? (
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <span className="text-muted-foreground">{step.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'done' ? 'text-muted-foreground line-through' :
                    step.status === 'active' ? 'font-semibold text-foreground' :
                    'text-muted-foreground'
                  }`}>{step.label}</p>
                  {step.status === 'active' && (
                    <div className="w-full bg-primary/10 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: '66%' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Cancel */}
        <div className="w-full px-8 pb-8 pt-4 z-10 bg-gradient-to-t from-card via-card to-transparent">
          <button onClick={() => navigate(-1)} className="w-full py-4 text-center text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Annuler l'analyse
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoading;
