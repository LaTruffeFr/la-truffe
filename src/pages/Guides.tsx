import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Footer } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Loader2, ShieldCheck, AlertTriangle, Wrench, 
  TrendingUp, BookOpen, HeartPulse, Activity
} from 'lucide-react';

const PROGRESS_MESSAGES = [
  "Consultation de la base de données mécanique...",
  "Analyse des défauts connus du modèle...",
  "Calcul de la fourchette marché...",
  "Rédaction du guide expert...",
];

export default function Guides() {
  const { toast } = useToast();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<any>(null);
  const [progressMsg, setProgressMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      toast({ title: "Champs requis", description: "Renseignez la marque et le modèle.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setGuide(null);

    // Progress animation
    let msgIndex = 0;
    setProgressMsg(PROGRESS_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, PROGRESS_MESSAGES.length - 1);
      setProgressMsg(PROGRESS_MESSAGES[msgIndex]);
    }, 2500);

    try {
      // Check cache first via direct query
      const { data: cached } = await supabase
        .from('model_guides')
        .select('*')
        .ilike('brand', brand.trim())
        .ilike('model', model.trim())
        .maybeSingle();

      if (cached) {
        setGuide(cached);
        clearInterval(interval);
        setLoading(false);
        return;
      }

      // Generate via edge function
      const { data, error } = await supabase.functions.invoke('generate-model-guide', {
        body: { brand: brand.trim(), model: model.trim() },
      });

      clearInterval(interval);

      if (error || data?.error) {
        toast({ title: "Erreur", description: data?.error || error?.message || "Impossible de générer le guide.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setGuide(data.guide);
    } catch (err: any) {
      clearInterval(interval);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const content = guide?.content;
  const reliabilityScore = content?.reliability_score || 0;
  const scoreColor = reliabilityScore >= 8 ? 'text-emerald-500' : reliabilityScore >= 6 ? 'text-amber-500' : 'text-rose-500';
  const scoreBg = reliabilityScore >= 8 ? 'bg-emerald-50 border-emerald-200' : reliabilityScore >= 6 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header activeLink="guides" />

      {/* Hero */}
      <div className="bg-slate-900 pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="relative max-w-3xl mx-auto text-center z-10">
          <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 mb-6 rounded-full font-bold uppercase tracking-widest text-xs">
            <BookOpen className="w-4 h-4 mr-1" /> Guide Fiabilité
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Tout savoir avant d'<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">acheter</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto mb-10">
            Maladies chroniques, fiabilité, fourchette de prix : notre moteur d'expertise vous dit tout sur le modèle qui vous intéresse.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Input
              placeholder="Marque (ex: BMW)"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="h-14 bg-white/10 border-white/20 text-white placeholder:text-slate-400 font-bold rounded-xl text-lg px-5"
            />
            <Input
              placeholder="Modèle (ex: Série 3)"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="h-14 bg-white/10 border-white/20 text-white placeholder:text-slate-400 font-bold rounded-xl text-lg px-5"
            />
            <Button type="submit" disabled={loading} className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-lg shrink-0">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6 animate-in fade-in">
          <div className="w-20 h-20 mx-auto bg-white rounded-3xl shadow-xl border border-indigo-50 flex items-center justify-center">
            <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-slate-700">{progressMsg}</p>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && content && (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Title */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
              {guide.brand} <span className="text-indigo-600">{guide.model}</span>
            </h2>
          </div>

          {/* Top cards grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Reliability */}
            <Card className={`rounded-[2rem] border ${scoreBg} shadow-md`}>
              <CardContent className="p-6 text-center">
                <HeartPulse className={`w-8 h-8 mx-auto mb-3 ${scoreColor}`} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fiabilité</p>
                <p className={`text-5xl font-black ${scoreColor}`}>{reliabilityScore}<span className="text-lg text-slate-400">/10</span></p>
              </CardContent>
            </Card>

            {/* Market range */}
            <Card className="rounded-[2rem] border-slate-100 shadow-md bg-slate-900 text-white">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fourchette Marché</p>
                <p className="text-2xl font-black text-white">{content.market_range}</p>
              </CardContent>
            </Card>

            {/* Expert verdict */}
            <Card className="rounded-[2rem] border-slate-100 shadow-md">
              <CardContent className="p-6 text-center">
                <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Verdict</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {reliabilityScore >= 8 ? "Modèle recommandé" : reliabilityScore >= 6 ? "Achat avec vigilance" : "Risque élevé"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card className="rounded-[2rem] border-slate-100 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Histoire du modèle
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed text-lg">{content.history_summary}</p>
            </CardContent>
          </Card>

          {/* Known issues */}
          <Card className="rounded-[2rem] border-slate-100 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Maladies Chroniques & Points de vigilance
              </h3>
              <div className="space-y-4">
                {(content.known_issues || []).map((issue: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                    <div className="bg-amber-100 p-2 rounded-xl shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">{issue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mechanic advice */}
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shrink-0">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-3">Conseil de l'expert</h3>
                <p className="text-lg font-medium italic font-serif leading-relaxed">"{content.mechanic_advice}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
