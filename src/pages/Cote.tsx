import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/landing";
import {
  Car,
  Gauge,
  Calendar,
  Euro,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Wrench,
  MessageSquareWarning,
  Copy,
  Check,
} from "lucide-react";

// Dictionnaire des prix de base
const BASE_PRICES: Record<string, number> = {
  mercedes: 45000,
  bmw: 45000,
  audi: 43000,
  porsche: 85000,
  volkswagen: 32000,
  peugeot: 26000,
  renault: 25000,
  citroen: 24000,
  toyota: 28000,
  ford: 27000,
  tesla: 45000,
};

// "Mini-Cerveau" Mécanique (En attendant la vraie IA backend)
const getExpertAdvice = (marque: string, km: number) => {
  const brand = marque.toLowerCase();

  if (brand.includes("mercedes")) {
    return {
      maladies: [
        {
          nom: "Vidange Boîte Auto (7G/9G-Tronic)",
          desc: "À vérifier absolument tous les 100 000 km. Si les rapports accrochent à froid, prévoyez 450€.",
        },
        {
          nom: "Tendeur de chaîne de distribution",
          desc: "Écoutez le moteur à froid capot ouvert. Un bruit métallique de crécelle = danger (1500€).",
        },
        {
          nom: "Filtre à Particules (FAP)",
          desc: "Vérifiez la sortie d'échappement. Si elle est noire de suie grasse, le FAP est saturé.",
        },
      ],
      sms: `Bonjour, la voiture m'intéresse. Vu le kilométrage (${km.toLocaleString()} km), on approche d'une zone de maintenance préventive (vidange boîte auto + usure trains roulants). Sans historique Mercedes 100% complet, je vous en propose [PRIX]€ avec paiement immédiat.`,
    };
  }

  if (brand.includes("peugeot") || brand.includes("citroen")) {
    return {
      maladies: [
        {
          nom: "Courroie de distribution (PureTech)",
          desc: "Maladie très connue. La courroie baigne dans l'huile et se désagrège. Vérifiez avec la jauge d'huile.",
        },
        {
          nom: "Consommation d'huile",
          desc: "Ces moteurs peuvent consommer jusqu'à 1L/1000km. Demandez au vendeur s'il fait souvent l'appoint.",
        },
        {
          nom: "Réservoir AdBlue (Si BlueHDi)",
          desc: "Le système cristallise et la pompe lâche. Coût de remplacement : environ 1200€.",
        },
      ],
      sms: `Bonjour. Intéressé par votre véhicule. Les moteurs de cette génération nécessitent une vigilance particulière (notamment sur la courroie/chaîne et l'AdBlue). Si vous avez les factures récentes pour me rassurer, je peux me positionner à [PRIX]€ rapidement.`,
    };
  }

  // Par défaut
  return {
    maladies: [
      {
        nom: "Historique d'entretien complet",
        desc: `À ${km.toLocaleString()} km, le carnet d'entretien doit être à jour avec les factures à l'appui.`,
      },
      {
        nom: "Usure des consommables",
        desc: "Vérifiez l'épaisseur des disques de freins et la date de fabrication des pneus (DOT).",
      },
      {
        nom: "Embrayage / Volant Moteur",
        desc: "Testez le point de patinage. S'il est très haut ou si la pédale est dure, l'embrayage est en fin de vie.",
      },
    ],
    sms: `Bonjour, votre annonce a retenu mon attention. Au vu du marché actuel et du kilométrage de ${km.toLocaleString()} km qui implique de futurs frais d'usure, ma proposition d'achat ferme se situe à [PRIX]€. Disponible pour échanger.`,
  };
};

export default function Cote() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [estimation, setEstimation] = useState({ min: 0, exact: 0, max: 0 });
  const [expertData, setExpertData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState({
    marque: "",
    modele: "",
    annee: new Date().getFullYear() - 5,
    km: 180000,
  });

  const calculateRealEstimate = () => {
    const brandKey = formData.marque.toLowerCase().trim();
    const basePrice = BASE_PRICES[brandKey] || 30000;
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - formData.annee);

    let ageMultiplier = 1;
    if (age === 1) ageMultiplier = 0.8;
    else if (age > 1) ageMultiplier = 0.8 * Math.pow(0.9, age - 1);
    if (brandKey === "porsche") ageMultiplier = 0.9 * Math.pow(0.95, age - 1);

    const expectedKm = age * 15000;
    const kmDifference = formData.km - expectedKm;

    let rawPrice = basePrice * ageMultiplier - (kmDifference / 1000) * 50;
    if (rawPrice < 1500) rawPrice = 1500 + Math.random() * 500;

    const exactPrice = Math.round(rawPrice / 100) * 100;

    setEstimation({
      min: Math.round(exactPrice * 0.92),
      exact: exactPrice,
      max: Math.round(exactPrice * 1.07),
    });

    // Générer les conseils experts
    setExpertData(getExpertAdvice(formData.marque, formData.km));

    return exactPrice;
  };

  const handleCopySMS = () => {
    if (!expertData) return;
    const finalSms = expertData.sms.replace("[PRIX]", estimation.min.toLocaleString("fr-FR"));
    navigator.clipboard.writeText(finalSms);
    setIsCopied(true);
    toast({ title: "Copié !", description: "SMS prêt à être envoyé au vendeur." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marque || !formData.modele) return;

    setStep("loading");
    calculateRealEstimate();

    try {
      await supabase.from("estimations").insert([
        {
          marque: formData.marque,
          modele: formData.modele,
          annee: formData.annee,
          kilometrage: formData.km,
          prix_estime: estimation.exact,
        },
      ]);
    } catch (err) {}

    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep("result"), 400);
      }
    }, 40);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <Header activeLink="cote" />

      <main className="flex-1 flex flex-col">
        {step === "form" && (
          <>
            <section className="relative pt-24 pb-32 bg-slate-900 text-white overflow-hidden text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <Badge className="bg-white/10 text-indigo-300 border border-white/20 px-4 py-1.5 mb-8 rounded-full font-bold uppercase tracking-widest text-xs">
                  Intelligence Artificielle V12
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                  Calculez la{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                    Vraie Valeur
                  </span>{" "}
                  de votre voiture.
                </h1>
                <p className="text-xl text-slate-300 font-medium">
                  Obtenez la cote exacte, les maladies moteurs à surveiller et un SMS de négociation généré sur-mesure.
                </p>
              </div>
            </section>

            <section className="relative z-20 -mt-20 pb-20">
              <div className="container mx-auto px-4 max-w-3xl">
                <Card className="rounded-[3rem] shadow-2xl border-0 overflow-hidden bg-white">
                  <div className="bg-slate-50 border-b border-slate-100 p-8 text-center">
                    <h2 className="text-2xl font-black text-slate-900">Scanner un modèle</h2>
                  </div>
                  <CardContent className="p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Car className="w-4 h-4 text-indigo-500" /> Marque
                          </Label>
                          <Input
                            placeholder="ex: Mercedes..."
                            className="h-14 text-lg font-black bg-slate-50 border-slate-200"
                            value={formData.marque}
                            onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Search className="w-4 h-4 text-indigo-500" /> Modèle
                          </Label>
                          <Input
                            placeholder="ex: CLA 220d..."
                            className="h-14 text-lg font-black bg-slate-50 border-slate-200"
                            value={formData.modele}
                            onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" /> Année
                          </Label>
                          <Input
                            type="number"
                            min="1990"
                            max={new Date().getFullYear()}
                            className="h-14 text-lg font-black bg-slate-50 border-slate-200"
                            value={formData.annee}
                            onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) || 0 })}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-emerald-500" /> Kilométrage
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="1000"
                              className="h-14 text-lg font-black bg-slate-50 border-slate-200 pr-12"
                              value={formData.km}
                              onChange={(e) => setFormData({ ...formData, km: parseInt(e.target.value) || 0 })}
                              required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                              km
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-16 text-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-transform active:scale-95 group"
                      >
                        Lancer l'Expertise IA{" "}
                        <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}

        {step === "loading" && (
          <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-4 min-h-[60vh]">
            <div className="text-center space-y-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-white rounded-[2rem] shadow-xl border border-indigo-50">
                <BrainCircuit className="w-16 h-16 text-indigo-600 animate-pulse relative z-10" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Diagnostic en cours...</h2>
                <p className="text-slate-500 font-bold">
                  Interrogation de la base de données mécaniques pour {formData.marque}
                </p>
              </div>
              <div className="bg-slate-200 rounded-full h-2 w-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {step === "result" && expertData && (
          <section className="flex-1 py-16 animate-in fade-in zoom-in-95 duration-700">
            <div className="container mx-auto px-4 max-w-5xl space-y-12">
              <div className="text-center">
                <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-2 mb-6 font-black uppercase tracking-widest text-[10px] rounded-full">
                  <CheckCircle2 className="w-4 h-4 mr-2 inline" /> Diagnostic Terminé
                </Badge>
                <h2 className="text-5xl md:text-6xl font-[1000] text-slate-900 tracking-tighter">
                  La Vraie Valeur de votre <span className="text-indigo-600 capitalize">{formData.marque}</span>
                </h2>
              </div>

              {/* COTE FINANCIERE */}
              <Card className="rounded-[4rem] border-0 shadow-2xl shadow-slate-200/50 bg-slate-950 overflow-hidden">
                <div className="p-12 md:p-20 text-center relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 opacity-5">
                    <Euro className="w-96 h-96 -mr-20 -mt-20" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-6">
                      Cote Officielle La Truffe
                    </p>
                    <div className="text-7xl md:text-9xl font-[1000] tracking-tighter mb-10 leading-none">
                      {estimation.exact.toLocaleString("fr-FR")} €
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-black bg-white/5 px-10 py-5 rounded-[2rem] backdrop-blur-xl border border-white/10 w-fit mx-auto">
                      <span className="flex items-center gap-3 text-rose-400">
                        <TrendingDown className="w-6 h-6" /> Achat Fort : {estimation.min.toLocaleString("fr-FR")} €
                      </span>
                      <span className="hidden sm:inline text-white/20">|</span>
                      <span className="flex items-center gap-3 text-emerald-400">
                        <TrendingUp className="w-6 h-6" /> Achat Patient : {estimation.max.toLocaleString("fr-FR")} €
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* DIAGNOSTIC IA + SMS */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* MALADIES MOTEURS */}
                <Card className="rounded-[3rem] border-0 shadow-xl shadow-slate-200/50 bg-white">
                  <CardContent className="p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                        <Wrench className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">Diagnostic IA</h3>
                        <p className="text-slate-500 font-bold text-sm">Les 3 maladies à vérifier absolument</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {expertData.maladies.map((maladie: any, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 mt-1">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-lg mb-1">{maladie.nom}</h4>
                            <p className="text-slate-600 font-medium leading-relaxed">{maladie.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* PLAYBOOK SMS */}
                <Card className="rounded-[3rem] border-0 shadow-xl shadow-slate-200/50 bg-indigo-600 text-white relative overflow-hidden group">
                  <CardContent className="p-10 space-y-8 relative z-10">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                      <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                        <MessageSquareWarning className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">Playbook Vendeur</h3>
                        <p className="text-indigo-200 font-bold text-sm">Votre SMS de négociation généré</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="bg-white text-slate-900 p-8 rounded-[2rem] rounded-bl-lg shadow-2xl relative">
                        <p className="text-lg font-medium leading-relaxed italic">
                          "{expertData.sms.replace("[PRIX]", estimation.min.toLocaleString("fr-FR"))}"
                        </p>
                      </div>
                      <Button
                        onClick={handleCopySMS}
                        className="absolute -bottom-5 -right-5 w-16 h-16 rounded-2xl bg-slate-900 text-white shadow-2xl border-4 border-white hover:bg-slate-800 transition-all active:scale-90 p-0"
                      >
                        {isCopied ? <Check className="w-7 h-7 text-emerald-400" /> : <Copy className="w-7 h-7" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* TUNNEL DE VENTE */}
              <div className="pt-10">
                <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden flex flex-col items-center">
                  <ShieldCheck className="w-16 h-16 text-emerald-400 mb-6" />
                  <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter">
                    Vous êtes sur le point d'acheter ?
                  </h3>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl mb-10">
                    Ne prenez aucun risque. Scannez l'URL de l'annonce Leboncoin pour obtenir le devis précis des
                    réparations et vérifier si le compteur a été trafiqué.
                  </p>
                  <Button
                    className="h-16 px-10 text-xl font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)]"
                    onClick={() => navigate("/audit")}
                  >
                    Auditer l'annonce complète
                  </Button>
                </div>
              </div>

              <div className="text-center pb-10">
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-slate-900 font-black"
                  onClick={() => setStep("form")}
                >
                  Refaire une estimation
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
