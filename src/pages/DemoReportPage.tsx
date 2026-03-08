import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, ExternalLink, Terminal, ShieldCheck, 
  Cpu, MessageSquareWarning, Zap, CheckCircle2, AlertTriangle, Loader2,
  Copy, Check, Snowflake, Flame, CircleDashed, Settings2, TrendingDown,
  ScanSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/landing/Footer";

// Fausses données simulant un retour parfait de l'Edge Function "URL Audit"
const demoUrlReport = {
  marque: "Tesla",
  modele: "Model 3 Grande Autonomie (AWD)",
  annee: 2021,
  kilometrage: 46500,
  prix_affiche: 29900,
  prix_truffe: 27100,
  score: 74,
  carburant: "Électrique",
  image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1200&auto=format&fit=crop",
  lien: "https://www.leboncoin.fr/ad/voitures/2489731548",
  tags_algo: [
    { label: "PRIX SURÉVALUÉ", type: "destructive" },
    { label: "GARANTIE BATTERIE ACTIVE", type: "success" },
    { label: "FORTE CONCURRENCE", type: "warning" },
    { label: "PROPRIÉTAIRE UNIQUE", type: "success" }
  ],
  options_extraites: ["Autopilot Amélioré", "Intérieur Blanc Premium", "Jantes 19\" Sport", "Pompe à chaleur", "Sièges chauffants AV/AR"],
  expert_opinion: "Cette Model 3 Grande Autonomie de 2021 est une excellente cuvée (présence de la pompe à chaleur). Cependant, le vendeur particulier l'a affichée à 29 900 €, ce qui est 2 800 € au-dessus du marché actuel. Les récentes baisses de prix de Tesla sur le neuf ont fait chuter la cote de l'occasion. Ne l'achetez pas à ce prix, une grosse marge de négociation est possible.",
  negotiation: [
    {
      titre: "La carte de la baisse des prix du neuf",
      desc: "C'est l'argument ultime sur les Tesla. Envoyez ce message : « Bonjour, votre configuration m'intéresse. Cependant, avec la récente baisse des prix et le bonus écologique sur les modèles neufs, votre prix d'occasion est trop proche du neuf. Si vous êtes prêt à la laisser à 27 100 €, je peux finaliser la vente rapidement. »"
    },
    {
      titre: "Vérifier le talon d'Achille (Les pneus)",
      desc: "Les Model 3 Dual Motor consomment énormément de pneus. L'annonce ne précise pas leur état. Si vous allez la voir, vérifiez-les. Un train de pneus 19 pouces coûte environ 800€. Si la gomme est proche du témoin, c'est un levier de négociation immédiat à utiliser devant le véhicule."
    }
  ]
};

// Composant pour la Jauge Circulaire
const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Couleur dynamique selon le score
  const colorClass = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto drop-shadow-sm">
      <svg className="transform -rotate-90 w-36 h-36">
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mt-1">
        <span className={`text-4xl font-black ${colorClass}`}>{score}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ 100</span>
      </div>
    </div>
  );
};

// Fonction pour associer une icône à une option détectée
const getOptionIcon = (opt: string) => {
  const text = opt.toLowerCase();
  if (text.includes('pompe')) return <Snowflake className="w-4 h-4 text-blue-500" />;
  if (text.includes('siège')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (text.includes('jante')) return <CircleDashed className="w-4 h-4 text-slate-700" />;
  if (text.includes('autopilot')) return <Cpu className="w-4 h-4 text-purple-500" />;
  return <Settings2 className="w-4 h-4 text-slate-500" />;
};


const DemoReportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Animation de chargement
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= 4) { clearInterval(timer); return 4; }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "Le message est prêt à être envoyé au vendeur." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const isLoading = loadingStep < 4;
  const report = demoUrlReport;
  const economy = report.prix_affiche - report.prix_truffe;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Helmet><title>Analyse en cours... | La Truffe</title></Helmet>
        <Card className="w-full max-w-lg border-primary/20 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-primary font-mono text-lg">
              <Terminal className="h-5 w-5 animate-pulse" /> Exemple : Analyse URL en cours...
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-mono text-sm">
            <Progress value={loadingStep * 25} className="h-1.5 mb-6 bg-slate-800 [&>div]:bg-primary" />
            <div className={`flex items-center gap-2 transition-all ${loadingStep >= 1 ? "text-primary" : "text-slate-600 opacity-30"}`}>
              {loadingStep === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} &gt; Scraping LeBonCoin... [OK]
            </div>
            <div className={`flex items-center gap-2 transition-all ${loadingStep >= 2 ? "text-primary" : "text-slate-600 opacity-30"}`}>
              {loadingStep === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : loadingStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 opacity-0" />} &gt; Extraction JSON via Gemini IA... [OK]
            </div>
            <div className={`flex items-center gap-2 transition-all ${loadingStep >= 3 ? "text-primary" : "text-slate-600 opacity-30"}`}>
              {loadingStep === 2 ? <Loader2 className="w-4 h-4 animate-spin" /> : loadingStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 opacity-0" />} &gt; Jugement strict Algo V11... [Score calculé]
            </div>
            <div className={`flex items-center gap-2 transition-all ${loadingStep >= 4 ? "text-primary" : "text-slate-600 opacity-30"}`}>
              {loadingStep === 3 ? <Loader2 className="w-4 h-4 animate-spin" /> : loadingStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 opacity-0" />} &gt; Rédaction argumentaire... [Terminé]
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Helmet><title>Rapport d'Audit : Tesla Model 3 | La Truffe</title></Helmet>

      {/* --- HEADER NAVBAR --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl tracking-tight text-slate-900">La Truffe</Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex bg-amber-100 text-amber-800 hover:bg-amber-100">
              Ceci est un exemple de rapport
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* --- CAR PROFILE BANNER --- */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg border-4 border-white shrink-0">
            <img src={report.image} alt={report.modele} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Leboncoin</Badge>
              <span className="text-sm text-slate-500 font-mono">ID: TSL-892X</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{report.marque} {report.modele}</h1>
            <p className="text-slate-500 font-medium mt-1">Année {report.annee} • {report.kilometrage.toLocaleString('fr-FR')} km • {report.carburant}</p>
          </div>
        </div>

        {/* =========================================
            HERO SECTION : LES 3 GROSSES CARTES GRID
            ========================================= */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* CARTE 1 : SCORE */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col justify-center py-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            <CardContent className="p-6 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-6 tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Score de Confiance
              </p>
              <ScoreCircularGauge score={report.score} />
              <p className="mt-6 text-sm text-slate-500">Véhicule intéressant, mais points d'attention détectés.</p>
            </CardContent>
          </Card>

          {/* CARTE 2 : PRIX & ÉCONOMIE */}
          <Card className="border-slate-200 shadow-sm bg-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <CardHeader className="pb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyse de Valeur</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Prix Vendeur</p>
                  <p className="text-2xl font-semibold text-slate-400 line-through decoration-red-400/50">{report.prix_affiche.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 mb-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-4 h-4"/> Vraie Cote</p>
                  <p className="text-4xl font-black text-slate-900">{report.prix_truffe.toLocaleString('fr-FR')} €</p>
                </div>
              </div>
              
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between border border-emerald-100 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 text-white p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-emerald-900">Marge de négo.</span>
                </div>
                <span className="text-2xl font-black text-emerald-600">+{economy.toLocaleString('fr-FR')} €</span>
              </div>
            </CardContent>
          </Card>

          {/* CARTE 3 : BADGES DU MARCHÉ (ALGO V11) */}
          <Card className="border-slate-200 shadow-sm bg-white">
             <CardHeader className="pb-4 border-b border-slate-50">
               <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-4 h-4 text-primary" /> Signaux détectés (V11)
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="flex flex-col gap-3">
                 {report.tags_algo.map((tag, i) => {
                   let badgeColor = "bg-slate-100 text-slate-700";
                   let Icon = Zap;
                   
                   if (tag.type === 'destructive') {
                     badgeColor = "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100";
                     Icon = AlertTriangle;
                   } else if (tag.type === 'success') {
                     badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100";
                     Icon = CheckCircle2;
                   } else if (tag.type === 'warning') {
                     badgeColor = "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100";
                     Icon = MessageSquareWarning;
                   }

                   return (
                     <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${badgeColor}`}>
                       <Icon className="w-5 h-5" />
                       <span className="font-bold text-sm">{tag.label}</span>
                     </div>
                   )
                 })}
               </div>
             </CardContent>
          </Card>
        </div>

        {/* =========================================
            SYNTHÈSE DE L'IA (ALERT BLOC)
            ========================================= */}
        <Alert className="bg-primary/5 border-primary/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
          <div className="bg-white p-4 rounded-full shadow-sm border border-primary/10 shrink-0">
            <ScanSearch className="w-8 h-8 text-primary" />
          </div>
          <div>
            <AlertTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              L'avis du Cerveau Hybride
            </AlertTitle>
            <AlertDescription className="text-slate-700 leading-relaxed text-base">
              {report.expert_opinion}
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid md:grid-cols-3 gap-8 pb-12">
          
          {/* =========================================
              PLAYBOOK DE NÉGOCIATION (TIMELINE)
              ========================================= */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareWarning className="w-6 h-6 text-primary" /> Votre Playbook de Négociation
            </h3>
            
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="border-l-2 border-slate-200 ml-4 pl-8 py-2 relative space-y-12">
                  
                  {report.negotiation.map((nego, i) => {
                    // Si la description contient un message entre guillemets, on le stylise façon SMS
                    const parts = nego.desc.split('«');
                    const hasSMS = parts.length === 2;

                    return (
                      <div key={i} className="relative">
                        {/* Point de la timeline */}
                        <div className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center font-bold text-slate-500 shadow-sm z-10">
                          {i+1}
                        </div>
                        
                        <h4 className="font-bold text-lg text-slate-900 mb-2">{nego.titre}</h4>
                        
                        {hasSMS ? (
                          <div className="space-y-4">
                            <p className="text-slate-600 leading-relaxed">{parts[0]}</p>
                            
                            {/* BULLE SMS */}
                            <div className="relative w-full md:w-5/6">
                              <div className="bg-blue-600 text-white p-5 rounded-2xl rounded-bl-sm shadow-md pr-12 relative">
                                <p className="text-[15px] leading-relaxed italic">
                                  "{parts[1].replace('»', '').trim()}"
                                </p>
                              </div>
                              {/* Bouton de copie flottant */}
                              <Button 
                                onClick={() => handleCopySMS(parts[1].replace('»', '').trim())}
                                className="absolute -bottom-4 right-4 shadow-lg rounded-full w-12 h-12 p-0 bg-slate-900 hover:bg-slate-800 transition-transform hover:scale-105"
                              >
                                {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {nego.desc}
                          </p>
                        )}
                      </div>
                    )
                  })}

                </div>
              </CardContent>
            </Card>
          </div>

          {/* =========================================
              OPTIONS EXTRAITES (GRILLE)
              ========================================= */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-purple-500" /> Équipements détectés
            </h3>
            
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-6">L'IA a lu la description et identifié ces options valorisantes qui justifient (en partie) le prix :</p>
                <div className="flex flex-col gap-3">
                  {report.options_extraites.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="bg-white p-2 rounded-md shadow-sm">
                        {getOptionIcon(opt)}
                      </div>
                      <span className="font-medium text-slate-700 text-sm">{opt}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
};

export default DemoReportPage;