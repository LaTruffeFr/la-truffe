import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, CheckCircle2, TrendingDown, AlertTriangle,
  ExternalLink, MapPin, Calendar, Fuel, Gauge, Copy, Check,
  ShieldCheck, ScanSearch, MessageSquareWarning, Cpu, 
  Settings2, Snowflake, Flame, CircleDashed, Zap
} from 'lucide-react';
import logoTruffe from '@/assets/logo-truffe-new.png';

// ========================
// UTILITY COMPONENTS
// ========================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const safeNum = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return Number(value).toLocaleString('fr-FR');
};

const ScoreCircularGauge = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="transform -rotate-90 w-36 h-36">
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted/30" />
        <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-black ${color}`}>{score}</span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">/ 100</span>
      </div>
    </div>
  );
};

const getOptionIcon = (opt: string) => {
  const t = opt.toLowerCase();
  if (t.includes('pompe') || t.includes('clim')) return <Snowflake className="w-4 h-4 text-blue-500" />;
  if (t.includes('siège') || t.includes('chauffant')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (t.includes('jante')) return <CircleDashed className="w-4 h-4 text-foreground/60" />;
  if (t.includes('auto') || t.includes('caméra') || t.includes('radar')) return <Cpu className="w-4 h-4 text-purple-500" />;
  return <Settings2 className="w-4 h-4 text-muted-foreground" />;
};

const getTagBadgeClass = (tag: string) => {
  if (tag.includes('💀') || tag.includes('🚨') || tag.includes('💥')) return "bg-destructive/10 text-destructive border-destructive/30";
  if (tag.includes('⚠️') || tag.includes('🔧') || tag.includes('🚩')) return "bg-warning/10 text-warning-foreground border-warning/30";
  if (tag.includes('🏆') || tag.includes('✨') || tag.includes('🦄')) return "bg-amber-100 text-amber-800 border-amber-300";
  if (tag.includes('💎') || tag.includes('📘') || tag.includes('🇫🇷')) return "bg-primary/10 text-primary border-primary/30";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

// ========================
// MAIN COMPONENT
// ========================

const PublicAudit = () => {
  const { id: shareToken } = useParams<{ id: string }>();
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!shareToken) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-public-report', {
          body: { shareToken }
        });
        if (fetchError || data?.error) { setError(data?.error || 'Rapport introuvable'); return; }
        setReport(data.report);
      } catch { setError('Une erreur est survenue'); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [shareToken]);

  const isSingleAudit = report?.market_data?.type === 'single_audit';
  const singleData = isSingleAudit ? report?.market_data : null;
  const vehicles = useMemo(() => report?.vehicles_data || [], [report]);

  const stats = useMemo(() => {
    if (!report) return null;
    if (isSingleAudit) {
      const pAffiche = Number(report.prix_affiche || 0);
      const pCible = Number(report.prix_truffe || report.prix_estime || pAffiche);
      return { prixAffiche: pAffiche, prixCible: pCible, economy: pAffiche - pCible, score: singleData?.score || 50 };
    }
    const avg = vehicles.length > 0 ? vehicles.reduce((s: number, v: any) => s + v.prix, 0) / vehicles.length : 0;
    return { prixAffiche: avg, prixCible: avg * 0.92, economy: avg * 0.08, score: 65 };
  }, [report, isSingleAudit, vehicles, singleData]);

  const negotiationPoints = useMemo(() => {
    if (!report?.negotiation_arguments) return [];
    try { const p = JSON.parse(report.negotiation_arguments); return Array.isArray(p) ? p : []; } catch { return []; }
  }, [report]);

  const allTags = useMemo(() => singleData?.tags || [], [singleData]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  // ========================
  // LOADING
  // ========================
  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground">Chargement de votre audit...</p></div>
    </div>
  );

  // ========================
  // ERROR
  // ========================
  if (error || !report || !stats) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md mx-4"><CardContent className="pt-6 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Audit non disponible</h2>
        <p className="text-muted-foreground mb-4">{error || 'Ce rapport n\'existe pas.'}</p>
        <Button onClick={() => window.location.href = '/'}>Retour</Button>
      </CardContent></Card>
    </div>
  );

  // ========================
  // SINGLE AUDIT DASHBOARD VIEW
  // ========================
  if (isSingleAudit) {
    const imageCover = singleData?.image_url || (singleData?.screenshot ? `data:image/png;base64,${singleData.screenshot}` : null);
    const descriptionVendeur = singleData?.description_vendeur || '';
    
    return (
      <div className="min-h-screen bg-background font-sans">
        {/* HEADER */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoTruffe} alt="La Truffe" className="h-9 w-9 rounded-lg object-cover shadow-corporate" />
              <span className="text-lg font-bold text-foreground">La Truffe</span>
            </div>
            <Badge variant="outline" className="text-xs font-medium">Audit Certifié</Badge>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
          {/* CAR BANNER */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            {imageCover && (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-corporate-lg border-4 border-card shrink-0 bg-muted">
                <img src={imageCover} alt={report.modele} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Audit URL</Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {report.marque} {report.modele}
              </h1>
              <div className="text-muted-foreground font-medium mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                {report.annee && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{report.annee}</span>}
                {report.kilometrage && <span className="flex items-center gap-1"><Gauge className="w-4 h-4" />{safeNum(report.kilometrage)} km</span>}
                {report.carburant && <span className="flex items-center gap-1"><Fuel className="w-4 h-4" />{report.carburant}</span>}
                {singleData?.localisation && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{singleData.localisation}</span>}
              </div>
              {report.lien_annonce && (
                <Button variant="link" className="mt-2 h-auto p-0 text-primary" onClick={() => window.open(report.lien_annonce, '_blank')}>
                  Voir l'annonce d'origine <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* HERO GRID - 3 CARDS */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* CARD 1: SCORE */}
            <Card className="border-border shadow-corporate bg-card overflow-hidden flex flex-col justify-center py-6 relative">
              <div className={`absolute top-0 left-0 w-full h-1 ${stats.score >= 80 ? 'bg-emerald-500' : stats.score >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} />
              <CardContent className="p-6 text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-6 tracking-widest flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Score La Truffe
                </p>
                <ScoreCircularGauge score={stats.score} />
                <p className="mt-6 text-sm font-medium text-muted-foreground">
                  {stats.score >= 80 ? "Excellent positionnement" : stats.score >= 60 ? "Correct, mais négociable" : "Achat déconseillé en l'état"}
                </p>
              </CardContent>
            </Card>

            {/* CARD 2: PRICE ANALYSIS */}
            <Card className="border-border shadow-corporate bg-card relative overflow-hidden flex flex-col justify-between">
              <div className={`absolute top-0 left-0 w-full h-1 ${stats.economy > 0 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <CardHeader className="pb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Analyse de Valeur</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-end border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Prix Vendeur</p>
                    <p className={`text-2xl font-semibold ${stats.economy > 0 ? 'text-muted-foreground line-through decoration-destructive/50' : 'text-foreground'}`}>
                      {safeNum(stats.prixAffiche)} €
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 mb-1 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Vraie Cote
                    </p>
                    <p className="text-4xl font-black text-foreground">{safeNum(stats.prixCible)} €</p>
                  </div>
                </div>
                <div className={`rounded-xl p-4 flex items-center justify-between border shadow-corporate ${stats.economy >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-lg">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      {stats.economy >= 0 ? 'Marge de négo.' : 'Économie estimée'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">
                    +{safeNum(Math.abs(stats.economy))} €
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: MARKET SIGNALS (Algorithm Tags) */}
            <Card className="border-border shadow-corporate bg-card">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Signaux du Marché
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag: string, i: number) => (
                      <Badge key={i} className={`text-xs font-bold px-3 py-1.5 border ${getTagBadgeClass(tag)}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun signal majeur détecté.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* EXPERT OPINION - Brain Section */}
          {report.expert_opinion && (
            <Alert className="bg-muted/50 border-primary/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-corporate">
              <div className="bg-card p-4 rounded-full shadow-corporate border border-primary/10 shrink-0">
                <ScanSearch className="w-8 h-8 text-primary" />
              </div>
              <div>
                <AlertTitle className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  Synthèse de l'Analyste
                </AlertTitle>
                <AlertDescription className="text-foreground/80 leading-relaxed text-base">
                  {report.expert_opinion}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* NEGOTIATION PLAYBOOK + EQUIPMENT GRID */}
          <div className="grid md:grid-cols-3 gap-8 pb-12">
            {/* PLAYBOOK (Timeline) */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MessageSquareWarning className="w-6 h-6 text-primary" /> Playbook de Négociation
              </h3>
              <Card className="border-border shadow-corporate overflow-hidden bg-card">
                <CardContent className="p-6 md:p-8">
                  <div className="border-l-2 border-muted ml-4 pl-8 py-2 relative space-y-12">
                    {negotiationPoints.length > 0 ? negotiationPoints.map((nego: any, i: number) => {
                      // Detect text between « » as SMS template
                      const smsMatch = nego.desc.match(/[«"]([\s\S]*?)[»"]/);
                      const beforeSms = smsMatch ? nego.desc.slice(0, nego.desc.indexOf(smsMatch[0])) : nego.desc;
                      const smsText = smsMatch ? smsMatch[1].trim() : null;

                      return (
                        <div key={i} className="relative">
                          <div className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center font-bold text-muted-foreground shadow-corporate z-10">
                            {i + 1}
                          </div>
                          <h4 className="font-bold text-lg text-foreground mb-2">{nego.titre}</h4>
                          
                          {smsText ? (
                            <div className="space-y-4">
                              <p className="text-muted-foreground leading-relaxed">{beforeSms}</p>
                              <div className="relative w-full md:w-5/6">
                                <div className="bg-primary text-primary-foreground p-5 rounded-2xl rounded-bl-sm shadow-corporate-md pr-12 relative">
                                  <p className="text-[15px] leading-relaxed italic">"{smsText}"</p>
                                </div>
                                <Button
                                  onClick={() => handleCopy(smsText, i)}
                                  className="absolute -bottom-4 right-4 shadow-corporate-lg rounded-full w-12 h-12 p-0 bg-foreground hover:bg-foreground/90 transition-transform hover:scale-105"
                                >
                                  {copiedIndex === i ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-background" />}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-xl border border-border">
                              {nego.desc}
                            </p>
                          )}
                        </div>
                      );
                    }) : (
                      <p className="text-muted-foreground italic">Aucun argument généré.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DEVIS DE LA TRUFFE */}
            {(() => {
              let devisItems: { piece: string; cout_euros: number }[] = [];
              try { devisItems = JSON.parse(report.notes || '[]'); } catch {}
              if (!Array.isArray(devisItems) || devisItems.length === 0) return null;
              const total = devisItems.reduce((s: number, d: any) => s + (d.cout_euros || 0), 0);
              return (
                <div className="md:col-span-2 space-y-6">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    🧾 Le Devis de La Truffe (Frais à prévoir)
                  </h3>
                  <Card className="border-border shadow-corporate bg-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="divide-y divide-dashed divide-border">
                        {devisItems.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center px-6 py-3">
                            <span className="text-sm text-foreground/80 font-medium">{item.piece}</span>
                            <span className="text-sm font-bold text-foreground font-mono">{safeNum(item.cout_euros)} €</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center px-6 py-4 bg-orange-50 dark:bg-orange-950/20 border-t-2 border-orange-300">
                        <span className="font-bold text-orange-800 dark:text-orange-300">TOTAL ESTIMÉ</span>
                        <span className="text-xl font-black text-orange-600 font-mono">{safeNum(total)} €</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* EQUIPMENT */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Cpu className="w-6 h-6 text-purple-500" /> Équipements
              </h3>
              <Card className="border-border shadow-corporate bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-3">
                    {singleData?.options?.length > 0 ? singleData.options.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                        <div className="bg-card p-2 rounded-md shadow-corporate">{getOptionIcon(opt)}</div>
                        <span className="font-medium text-foreground/80 text-sm capitalize">{opt.toLowerCase()}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground italic">Options non précisées.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* VENDOR DESCRIPTION (cleaned) */}
          {descriptionVendeur && (
            <Card className="border-border shadow-corporate bg-card mb-8">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Description du vendeur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed capitalize whitespace-pre-wrap">
                  {descriptionVendeur.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* FOOTER */}
          <footer className="border-t border-border pt-8 text-center pb-8">
            <p className="text-muted-foreground text-sm">Document généré par l'algorithme La Truffe. Ne constitue pas une garantie mécanique.</p>
            <p className="text-muted-foreground text-xs mt-2">© {new Date().getFullYear()} La Truffe — Tous droits réservés</p>
          </footer>
        </main>
      </div>
    );
  }

  // ========================
  // MARKET AUDIT VIEW (Multiple vehicles - existing logic)
  // ========================
  const avgPrice = vehicles.length > 0 ? vehicles.reduce((s: number, v: any) => s + v.prix, 0) / vehicles.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoTruffe} alt="La Truffe" className="h-10 w-10 rounded-lg object-cover shadow-corporate" />
            <span className="text-xl font-bold text-foreground">La Truffe</span>
          </div>
          <Badge variant="outline" className="text-xs">Audit Public</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm px-4 py-1">
            <CheckCircle2 className="h-4 w-4 mr-2" /> AUDIT COMPLÉTÉ
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Audit de Prix : {report.marque} {report.modele}
          </h1>
          <p className="text-muted-foreground">
            {new Date(report.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border shadow-corporate">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Prix Marché Moyen</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(avgPrice)}</div>
              <p className="text-xs text-muted-foreground mt-1">Basé sur {vehicles.length} annonces</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5 shadow-corporate">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Meilleur Prix</div>
              <div className="text-3xl font-bold text-primary">
                {vehicles.length > 0 ? formatCurrency(Math.min(...vehicles.map((v: any) => v.prix))) : '—'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-corporate">
            <CardContent className="pt-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Économie Max</div>
              <div className="text-3xl font-bold text-emerald-600">
                {vehicles.length > 0 ? formatCurrency(avgPrice - Math.min(...vehicles.map((v: any) => v.prix))) : '—'}
              </div>
              <TrendingDown className="h-5 w-5 text-emerald-600 mx-auto mt-1" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          {vehicles.map((vehicle: any, index: number) => (
            <Card key={index} className="hover:shadow-corporate-md transition-shadow border-border">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    #{index + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-lg">{vehicle.titre}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      {vehicle.annee && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{vehicle.annee}</span>}
                      <span className="flex items-center gap-1"><Gauge className="h-4 w-4" />{safeNum(vehicle.kilometrage)} km</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(vehicle.prix)}</div>
                    {vehicle.gain_potentiel > 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                        -{formatCurrency(vehicle.gain_potentiel)}
                      </Badge>
                    )}
                  </div>
                  {vehicle.lien && (
                    <Button onClick={() => window.open(vehicle.lien, '_blank')} className="gap-2">
                      Voir <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <footer className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-sm">Document généré par La Truffe. Ne constitue pas une garantie mécanique.</p>
          <p className="text-muted-foreground text-xs mt-2">© {new Date().getFullYear()} La Truffe</p>
        </footer>
      </main>
    </div>
  );
};

export default PublicAudit;
