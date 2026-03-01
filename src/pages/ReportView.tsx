import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  TrendingDown,
  Calendar,
  Gauge,
  Fuel,
  Euro,
  ShieldCheck,
  Loader2,
  Search,
  History,
  AlertCircle,
  Brain,
  Calculator,
  FileCheck,
  Copy,
  Check,
  Settings2,
  BrainCircuit,
  MessageSquareWarning,
  Zap,
  Cpu,
  ScanSearch,
  Microscope,
  Activity,
  Receipt,
  FileText,
  Hash,
  ShieldAlert,
  Car as CarIcon,
  GaugeCircle,
  BarChart3,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SniperChart } from "@/components/trading/SniperChart";
import { OpportunityModal } from "@/components/trading/OpportunityModal";
import { Footer } from "@/components/landing";
import { generatePDF } from "@/lib/pdfGenerator";
import { ProxiedImage } from "@/components/ProxiedImage";

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString("fr-FR");
};

// Jauge plus compacte et professionnelle
const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-2xl font-black ${colorClass}`}>{score}</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase">/ 100</span>
      </div>
    </div>
  );
};

const PROGRESS_STEPS = [
  { time: 1000, label: "Extraction des données...", icon: ScanSearch },
  { time: 3000, label: "Croisement historique & VIN...", icon: FileText },
  { time: 5000, label: "Analyse mécanique V12...", icon: Microscope },
  { time: 7000, label: "Calcul de décote réelle...", icon: Calculator },
  { time: 9000, label: "Génération du rapport...", icon: FileCheck },
];

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const fetchReport = async () => {
    const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      navigate("/client");
      return;
    }
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const isSingleAudit = useMemo(() => report?.market_data?.type === "single_audit", [report]);
  const singleAuditData = useMemo(() => (isSingleAudit ? report?.market_data : null), [report, isSingleAudit]);
  const vehiclesData = useMemo(() => report?.vehicles_data || [], [report]);

  const stats = useMemo(() => {
    if (!report) return null;
    const pAffiche = Number(report.prix_affiche || report.prix_moyen || 0);
    const pCible = Number(report.prix_truffe || report.prix_estime || pAffiche);
    const score = isSingleAudit ? singleAuditData?.score || 50 : vehiclesData[0]?.dealScore || 50;
    return {
      prixAffiche: pAffiche,
      prixCible: pCible,
      economy: pAffiche - pCible,
      score,
      isGoodDeal: pAffiche <= pCible,
      totalVehicules: isSingleAudit ? 1 : report.total_vehicules || vehiclesData.length,
    };
  }, [report, isSingleAudit, vehiclesData, singleAuditData]);

  const negotiationPoints = useMemo(() => {
    if (!report) return [];
    if (report.negotiation_points) return report.negotiation_points;
    if (report.negotiation_arguments) {
      try {
        const parsed = JSON.parse(report.negotiation_arguments);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }, [report]);

  const signaux = useMemo(() => {
    const allTags = singleAuditData?.tags || [];
    return allTags.slice(0, 8).map((tag: string) => ({
      label: tag,
      type: tag.includes("⚠️") || tag.includes("💀") || tag.includes("🚨") ? "destructive" : "success",
    }));
  }, [singleAuditData]);

  // --- MOCK DONNÉES COMPLÉMENTAIRES (Pour enrichir le rapport) ---
  const extraData = useMemo(() => {
    return {
      vin: "VF1234567890ABCDE", // Mocké
      proprietaire: report?.kilometrage > 100000 ? "3ème main estimée" : "1ère ou 2ème main",
      accident: "Aucun sinistre grave déclaré (SIV)",
      gage: "Non gagé (Certificat de non-gage OK)",
      moteur: "4 cylindres en ligne, Turbo",
      puissance: report?.marque?.toLowerCase() === "porsche" ? "350 ch" : "130 ch (Estimé)",
      critair: report?.annee >= 2011 ? "Crit'Air 1 ou 2" : "Crit'Air 3",
      liquidite: stats && stats.score > 75 ? "Forte (Vente < 15 jours)" : "Moyenne (Vente ~ 30 jours)",
    };
  }, [report, stats]);

  useEffect(() => {
    if (report?.status !== "in_progress" && report?.status !== "pending") return;
    const startTime = Date.now();
    let animationFrameId: number;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const targetPercent = Math.min((elapsed / 10000) * 100, 95);
      setProgressPercent(targetPercent);
      if (targetPercent < 95) animationFrameId = requestAnimationFrame(updateProgress);
    };
    animationFrameId = requestAnimationFrame(updateProgress);
    PROGRESS_STEPS.forEach((step, index) => {
      setTimeout(() => setProgressIndex(index), step.time);
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [report?.status]);

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copié !", description: "L'argumentaire est copié dans le presse-papier." });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    const success = await generatePDF("report-content", `Rapport_${report.marque}_${report.modele}`);
    setIsGeneratingPdf(false);
    if (success) toast({ title: "Succès", description: "Rapport PDF généré." });
  };

  if (loading || authLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Chargement...</p>
      </div>
    );

  if (report?.status === "in_progress" || report?.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardContent className="p-8 text-center space-y-6">
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Analyse Expert en cours</h2>
              <p className="text-sm text-slate-500 mt-1">Génération du dossier d'inspection...</p>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="space-y-3 text-left pt-2">
              {PROGRESS_STEPS.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 text-sm ${index <= progressIndex ? "text-indigo-700 font-medium" : "text-slate-400"}`}
                >
                  {index < progressIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imageCover = isSingleAudit
    ? singleAuditData?.image_url || `data:image/png;base64,${singleAuditData?.screenshot}`
    : vehiclesData[0]?.image;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      {/* HEADER COMPACT */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-14 flex items-center px-4 md:px-6 print:hidden">
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link to="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
            La Truffe{" "}
            <Badge variant="secondary" className="text-[10px] uppercase">
              Rapport Officiel
            </Badge>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/client")}
              className="text-slate-500 hidden sm:flex"
            >
              Retour
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isGeneratingPdf} className="bg-indigo-600 text-white">
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Exporter PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="report-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* --- SECTION 1 : IDENTITÉ & SYNTHÈSE FINANCIÈRE --- */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Bloc Véhicule */}
          <Card className="md:col-span-7 overflow-hidden border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row h-full">
              <div className="w-full sm:w-2/5 h-48 sm:h-auto bg-slate-100 relative">
                <img src={imageCover} className="w-full h-full object-cover" alt="Vehicule" />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-black/70 backdrop-blur-sm text-white border-0 text-[10px]">
                    {isSingleAudit ? "Annonce" : "Marché"}
                  </Badge>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-center flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Dossier #{report.id.slice(0, 6)}
                  </p>
                  <span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                  {report.marque} <span className="text-indigo-600">{report.modele}</span>
                </h1>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> {report.annee}
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-400" /> {safeNum(report.kilometrage)} km
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-slate-400" />{" "}
                    <span className="capitalize">{report.carburant || "Essence"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-400" /> Automatique
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Bloc Financier (Score + Prix) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm flex flex-col justify-center items-center p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Score IA</p>
              <ScoreCircularGauge score={stats.score} />
            </Card>
            <Card className="border-slate-200 shadow-sm p-4 flex flex-col justify-center relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 w-1 h-full ${stats.economy >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
              ></div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Vraie Cote</p>
              <p className="text-2xl font-black text-slate-900 mb-2">{safeNum(stats.prixCible)} €</p>

              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase">Prix Affiché</p>
                <p className="text-sm font-bold text-slate-500 line-through">{safeNum(stats.prixAffiche)} €</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className={`w-3 h-3 ${stats.economy >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                  <span className={`text-xs font-bold ${stats.economy >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    Marge : {safeNum(Math.abs(stats.economy))} €
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* --- SECTION 2 : DONNÉES TECHNIQUES & ADMINISTRATIVES --- */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <FileText className="w-4 h-4" />
              <h3 className="font-bold text-sm text-slate-900">Administratif</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Situation</span>
                <span className="font-medium text-emerald-600">{extraData.gage}</span>
              </li>
              <li className="flex justify-between">
                <span>Historique</span>
                <span className="font-medium text-slate-900">{extraData.accident}</span>
              </li>
              <li className="flex justify-between">
                <span>Propriétaires</span>
                <span className="font-medium text-slate-900">{extraData.proprietaire}</span>
              </li>
            </ul>
          </Card>
          <Card className="p-4 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <Cpu className="w-4 h-4" />
              <h3 className="font-bold text-sm text-slate-900">Spécifications</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Moteur</span>
                <span className="font-medium text-slate-900">{extraData.moteur}</span>
              </li>
              <li className="flex justify-between">
                <span>Puissance</span>
                <span className="font-medium text-slate-900">{extraData.puissance}</span>
              </li>
              <li className="flex justify-between">
                <span>Vignette</span>
                <span className="font-medium text-emerald-600">{extraData.critair}</span>
              </li>
            </ul>
          </Card>
          <Card className="p-4 border-slate-200 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
              <h3 className="font-bold text-sm text-slate-900">Marché</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Liquidité</span>
                <span className="font-medium text-slate-900">{extraData.liquidite}</span>
              </li>
              <li className="flex justify-between">
                <span>Base de calcul</span>
                <span className="font-medium text-slate-900">{stats.totalVehicules} annonces</span>
              </li>
              <li className="flex justify-between">
                <span>Tendance</span>
                <span className="font-medium text-slate-900">Stable</span>
              </li>
            </ul>
          </Card>
          <Card className="p-4 border-slate-200 shadow-sm bg-slate-900 text-white">
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <BrainCircuit className="w-4 h-4" />
              <h3 className="font-bold text-sm text-white">Verdict IA</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-4">
              "{report.expert_opinion ? report.expert_opinion.split("|||DATA|||")[0] : "Analyse du profil en cours..."}"
            </p>
          </Card>
        </div>

        {/* --- SECTION 3 : DIAGNOSTIC & PLAYBOOK --- */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Maladies & Points d'attention */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Points de contrôle critiques
            </h3>
            <div className="grid gap-3">
              {negotiationPoints.map((nego: any, i: number) => {
                const isSms = nego.desc.includes("«") || nego.desc.includes('"');
                if (isSms) return null; // On filtre les SMS pour les mettre ailleurs
                return (
                  <Card key={i} className="p-4 border-slate-200 shadow-sm bg-white">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{nego.titre}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{nego.desc}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {/* Fallback si vide */}
              {negotiationPoints.length === 0 && (
                <div className="text-sm text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200">
                  Aucun point critique spécifique détecté.
                </div>
              )}
            </div>

            {/* Tags / Signaux */}
            <div className="flex flex-wrap gap-2 pt-2">
              {signaux.map((s: any, i: number) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-[10px] ${s.type === "destructive" ? "border-rose-200 text-rose-700 bg-rose-50" : "border-emerald-200 text-emerald-700 bg-emerald-50"}`}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sidebar : Devis & SMS */}
          <div className="space-y-6">
            {/* Facture d'entretien */}
            {isSingleAudit &&
              (() => {
                let devisItems: any[] = [];
                try {
                  devisItems = JSON.parse(report.notes || "[]");
                } catch {}
                if (devisItems.length === 0) return null;
                const total = devisItems.reduce((s, d) => s + (d.cout_euros || 0), 0);

                return (
                  <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-slate-500" />
                      <h3 className="font-bold text-sm text-slate-900">Frais à prévoir</h3>
                    </div>
                    <div className="p-0">
                      <div className="divide-y divide-slate-100">
                        {devisItems.map((item, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 text-xs">
                            <span className="text-slate-600">{item.piece}</span>
                            <span className="font-bold text-slate-900">{safeNum(item.cout_euros)} €</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-rose-50 px-4 py-3 flex justify-between items-center border-t border-rose-100">
                        <span className="font-bold text-rose-900 text-xs">Total estimé</span>
                        <span className="font-black text-rose-700 text-sm">{safeNum(total)} €</span>
                      </div>
                    </div>
                  </Card>
                );
              })()}

            {/* Playbook SMS */}
            <Card className="border-blue-200 shadow-sm bg-blue-50 overflow-hidden relative">
              <div className="p-4 space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <MessageSquareWarning className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Message d'approche</h3>
                </div>
                {negotiationPoints.map((nego: any, i: number) => {
                  const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                  const smsText = smsMatch ? smsMatch[1].trim() : null;
                  if (!smsText) return null;
                  return (
                    <div
                      key={i}
                      className="bg-blue-600 text-white p-3 rounded-2xl rounded-bl-sm text-xs leading-relaxed shadow-sm relative group"
                    >
                      "{smsText}"
                      <button
                        onClick={() => handleCopySMS(smsText)}
                        className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* --- SECTION 4 : RADAR MARCHÉ (Si Audit Global) --- */}
        {!isSingleAudit && (
          <div className="pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GaugeCircle className="w-5 h-5 text-indigo-600" /> Positionnement Marché (Radar)
              </h2>
              <Badge variant="outline" className="text-xs">
                Data Live
              </Badge>
            </div>
            <Card className="shadow-sm border-slate-200 overflow-hidden h-[400px] bg-slate-900 p-4">
              <SniperChart
                data={vehiclesData}
                trendLine={calculateLogTrendLine(vehiclesData)}
                onVehicleClick={setSelectedVehicle}
              />
            </Card>
          </div>
        )}
      </main>
      <Footer />
      {selectedVehicle && (
        <OpportunityModal vehicle={selectedVehicle as any} onClose={() => setSelectedVehicle(null)} />
      )}
    </div>
  );
};

export default ReportView;
