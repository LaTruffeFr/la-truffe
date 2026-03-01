import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/landing';
import { 
  Car, Gauge, Calendar, Euro, Fuel, Phone,
  Camera, UploadCloud, X, ArrowRight, ShieldCheck, 
  CheckCircle2, Lock, Settings2, FileText, Zap, Trophy,
  AlertCircle, Sparkles, Info, Loader2, CheckCircle
} from 'lucide-react';

export default function Vendre() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  
  // Gestion des images (fichiers bruts et prévisualisations)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [certification, setCertification] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    marque: '', 
    modele: '', 
    motorisation: '',
    carburant: '',    
    couleur: '',      
    year: new Date().getFullYear() - 5, 
    mileage: 60000, 
    price: 15000, 
    description: '', 
    contact: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      // Optionnel : tu pourrais rediriger automatiquement
      // navigate('/auth?redirect=/vendre&message=Créez un compte pour vendre');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- GESTION DES 5 IMAGES MAXIMUM ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    if (imageFiles.length + files.length > 5) {
      toast({ 
        variant: "destructive", 
        title: "Limite atteinte 📸", 
        description: "Vous ne pouvez ajouter que 5 photos maximum." 
      });
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreviews(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- SOUMISSION À L'IA ET SUPABASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (imageFiles.length === 0) return alert("Une photo est obligatoire pour l'analyse IA !");
    if (!formData.contact) return alert("Indiquez un moyen de contact.");
    if (!formData.motorisation || !formData.carburant) return alert("La motorisation et le carburant sont obligatoires.");
    
    setLoading(true);
    
    try {
      setLoadingStep("🧠 Expertise de votre annonce par La Truffe...");
      
      // 1. Appel de l'Edge Function pour l'analyse
      const { data: aiAnalysis, error: aiError } = await supabase.functions.invoke('analyze-manual-listing', {
        body: {
          marque: formData.marque,
          modele: `${formData.modele} ${formData.motorisation}`,
          carburant: formData.carburant,
          annee: Number(formData.year),
          kilometrage: Number(formData.mileage),
          prix: Number(formData.price),
          description: `Couleur: ${formData.couleur}. ${formData.description}`
        }
      });

      if (aiError || !aiAnalysis) {
        console.error("Erreur IA:", aiError);
        throw new Error("L'IA n'a pas pu analyser votre véhicule. Veuillez réessayer.");
      }
      
      const aiResult = { 
        score: aiAnalysis.score, 
        avis: aiAnalysis.expert_opinion, 
        tags: aiAnalysis.tags, 
        arguments: aiAnalysis.negotiation_arguments, 
        devis: aiAnalysis.devis_estime 
      };
      setCertification(aiResult);

      setLoadingStep("☁️ Sécurisation des photos...");
      const publicUrls: string[] = [];

      // 2. Upload de TOUTES les images
      for (const file of imageFiles) {
        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('user-car-photos') // Assure-toi que ce bucket existe dans Supabase !
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('user-car-photos')
          .getPublicUrl(fileName);
        
        publicUrls.push(publicUrlData.publicUrl);
      }

      setLoadingStep("📝 Création de l'annonce certifiée...");
      
      // 3. Sauvegarde dans marketplace_listings
      const { error: dbError } = await supabase.from('marketplace_listings').insert({
        user_id: user.id,
        marque: formData.marque,
        modele: `${formData.modele} ${formData.motorisation}`,
        annee: Number(formData.year),
        kilometrage: Number(formData.mileage),
        prix: Number(formData.price),
        carburant: formData.carburant,
        description: `Couleur : ${formData.couleur}\n\n${formData.description}`,
        image_url: publicUrls[0], // On garde la première image comme image principale
        images: publicUrls, // On stocke le tableau complet des URL
        seller_contact: formData.contact,
        status: 'pending',
        score_ia: aiResult.score,
        ai_avis: aiResult.avis,
        ai_tags: aiResult.tags,
        ai_arguments: aiResult.arguments,
        ai_devis: aiResult.devis,
      } as any); // "as any" en attendant la création stricte de la table

      if (dbError) throw dbError;
      
      setStep(3); 

    } catch (error: any) {
      console.error(error);
      alert("Erreur : " + (error.message || "Une erreur inconnue est survenue"));
    } finally {
      setLoading(false);
    }
  };

  // --- ÉCRAN DE CHARGEMENT INITIAL ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  // --- ÉCRAN DE BLOCAGE SI NON CONNECTÉ ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
        <Header activeLink="vendre" />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-[3rem] shadow-2xl border-0 bg-white text-center p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4">Accès Restreint</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">Pour garantir la sécurité de notre marketplace, vous devez posséder un compte pour déposer une annonce certifiée.</p>
            <Button className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl" onClick={() => navigate('/auth')}>
              Se connecter ou s'inscrire
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <Header activeLink="vendre" />

      <main className="flex-1 pb-24">
        
        {/* HERO SECTION */}
        <section className="bg-slate-900 text-white pt-20 pb-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10 max-w-3xl">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 mb-6 rounded-full font-black uppercase tracking-widest text-[10px]">
              Dépôt Gratuit & 100% Sécurisé
            </Badge>
            <h1 className="text-4xl md:text-6xl font-[1000] tracking-tighter mb-6 leading-tight">
              Vendez votre voiture au <span className="text-emerald-400">Juste Prix</span>.
            </h1>
            <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto">
              Notre IA certifie votre annonce. Les acheteurs sont rassurés, vous vendez 2x plus vite sans négociation inutile.
            </p>
          </div>
        </section>

        {/* CONTENU PRINCIPAL */}
        <section className="relative z-20 -mt-20">
          <div className="container mx-auto px-4 max-w-6xl">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* COLONNE GAUCHE : LE FORMULAIRE OU LE RÉSULTAT */}
              <div className="lg:col-span-2 space-y-8">
                
                {step === 1 && (
                  <form onSubmit={handleSubmit}>
                    <Card className="rounded-[3rem] shadow-2xl border-0 bg-white overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-100 p-8 flex items-center gap-4">
                        <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                          <Car className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900">Informations du véhicule</h2>
                          <p className="text-slate-500 text-sm font-medium">Les annonces précises attirent 80% de clics en plus.</p>
                        </div>
                      </div>

                      <CardContent className="p-8 md:p-12 space-y-12">
                        
                        {/* --- BLOC 1 : CARACTÉRISTIQUES --- */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2"><Settings2 className="w-5 h-5 text-indigo-500"/> Fiche Technique</h3>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="font-bold text-slate-700">Marque</Label>
                              <Input name="marque" placeholder="Ex: BMW" value={formData.marque} onChange={handleChange} className="h-14 bg-slate-50 border-slate-200 font-bold text-lg" required />
                            </div>
                            <div className="space-y-3">
                              <Label className="font-bold text-slate-700">Modèle précis</Label>
                              <Input name="modele" placeholder="Ex: Série 3 M340i xDrive" value={formData.modele} onChange={handleChange} className="h-14 bg-slate-50 border-slate-200 font-bold text-lg" required />
                            </div>
                          </div>

                          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-indigo-900 font-bold flex items-center gap-2">
                                Motorisation <Info className="w-4 h-4 text-indigo-500" />
                              </Label>
                              <Input name="motorisation" placeholder="Ex: 3.0 L 374ch" value={formData.motorisation} onChange={handleChange} className="h-12 bg-white border-indigo-200 font-bold" required />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-indigo-900 font-bold">Carburant</Label>
                              <select name="carburant" value={formData.carburant} onChange={handleChange} className="flex h-12 w-full rounded-md border border-indigo-200 bg-white px-3 font-bold text-slate-900" required>
                                <option value="">Sélectionnez...</option>
                                <option value="Essence">Essence</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Hybride">Hybride</option>
                                <option value="Electrique">Électrique</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <Label className="font-bold text-slate-700">Année</Label>
                              <Input type="number" name="year" value={formData.year} onChange={handleChange} className="h-14 bg-slate-50 border-slate-200 font-bold text-lg" required />
                            </div>
                            <div className="space-y-3">
                              <Label className="font-bold text-slate-700">Kilométrage</Label>
                              <div className="relative">
                                <Input type="number" name="mileage" step="1000" value={formData.mileage} onChange={handleChange} className="h-14 bg-slate-50 border-slate-200 font-bold text-lg pr-12" required />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">km</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="font-bold text-slate-700">Couleur</Label>
                              <Input name="couleur" placeholder="Ex: Bleu Portimao" value={formData.couleur} onChange={handleChange} className="h-14 bg-slate-50 border-slate-200 font-bold text-lg" />
                            </div>
                          </div>
                        </div>

                        {/* --- BLOC 2 : PRIX & DESCRIPTION --- */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2"><FileText className="w-5 h-5 text-indigo-500"/> L'Offre</h3>
                          
                          <div className="space-y-3">
                            <Label className="font-bold text-slate-700">Prix de vente</Label>
                            <div className="relative max-w-xs">
                              <Input type="number" name="price" step="100" value={formData.price} onChange={handleChange} className="h-16 bg-emerald-50 border-emerald-200 text-emerald-700 font-[1000] text-2xl pr-12" required />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">€</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="font-bold text-slate-700">Description détaillée</Label>
                            <Textarea 
                              name="description" 
                              placeholder="Soyez transparent. Listez les options, l'état des pneus, les entretiens récents, et les éventuels défauts. L'IA récompensera votre honnêteté par un meilleur score." 
                              value={formData.description} 
                              onChange={handleChange} 
                              className="min-h-[160px] bg-slate-50 border-slate-200 font-medium text-base resize-y rounded-2xl p-4" 
                              required 
                            />
                          </div>
                        </div>

                        {/* --- BLOC 3 : PHOTOS (MAX 5) --- */}
                        <div className="space-y-6">
                          <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Camera className="w-5 h-5 text-indigo-500"/> Photos</h3>
                            <span className="text-sm font-bold text-slate-400">{imagePreviews.length} / 5 MAX</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {imagePreviews.map((img, index) => (
                              <div key={index} className="aspect-square rounded-2xl overflow-hidden relative border-2 border-indigo-100 group shadow-sm">
                                <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-rose-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                                {index === 0 && <Badge className="absolute bottom-2 left-2 bg-indigo-600 border-0 text-[10px] uppercase">Principale</Badge>}
                              </div>
                            ))}

                            {imagePreviews.length < 5 && (
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <UploadCloud className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Ajouter</span>
                              </div>
                            )}
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                        </div>

                        {/* --- BLOC 4 : CONTACT --- */}
                        <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2"><Phone className="w-5 h-5 text-indigo-500"/> Coordonnées</h3>
                          <div className="space-y-3 max-w-sm">
                            <Label className="font-bold text-slate-700">Numéro de téléphone</Label>
                            <Input type="tel" name="contact" placeholder="06 12 34 56 78" value={formData.contact} onChange={handleChange} className="h-14 bg-white border-slate-200 font-bold text-lg" required />
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500"/> Visible uniquement par les acheteurs inscrits.</p>
                          </div>
                        </div>

                        {/* BOUTON SUBMIT */}
                        <div className="pt-4">
                          <Button type="submit" disabled={loading} className="w-full h-16 text-xl font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-3">
                            {loading ? (
                              <><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> {loadingStep}</>
                            ) : (
                              <><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Soumettre l'annonce à l'IA</>
                            )}
                          </Button>
                        </div>

                      </CardContent>
                    </Card>
                  </form>
                )}

                {/* ÉTAPE DE SUCCÈS (RÉSULTAT IA) */}
                {step === 3 && certification && (
                  <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-indigo-50 opacity-50 pointer-events-none" />
                    
                    <CardContent className="pt-16 pb-16 px-10 text-center relative z-10">
                      <div className="mb-8 inline-flex p-4 bg-emerald-100 rounded-[2rem] ring-8 ring-white shadow-xl animate-in zoom-in duration-500">
                        <CheckCircle className="w-16 h-16 text-emerald-600" />
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">Annonce en Modération</h2>
                      <p className="text-lg text-slate-600 mb-12 font-medium">Votre véhicule a été analysé par LaTruffe. Il sera publié dès validation par notre équipe.</p>

                      <div className="grid md:grid-cols-2 gap-10 text-left bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-12">
                        
                        <div className="flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-10">
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Score de Confiance IA</span>
                          <div className={`text-8xl font-[1000] tracking-tighter ${certification.score > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {certification.score}
                          </div>
                          <div className="mt-4 flex gap-2">
                            {certification.score > 80 && (
                              <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-xs font-black rounded-lg flex items-center gap-1.5 uppercase">
                                <Trophy className="w-3 h-3" /> Pépite
                              </span>
                            )}
                            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg flex items-center gap-1.5 uppercase">
                              <ShieldCheck className="w-3 h-3" /> IA Vérifié
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center pt-4 md:pt-0">
                          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
                            <Sparkles className="w-5 h-5 text-indigo-500" /> Avis Préliminaire
                          </h3>
                          <p className="text-slate-600 italic leading-relaxed font-medium">"{certification.avis}"</p>
                          
                          <div className="mt-6 flex flex-wrap gap-2">
                            {certification.tags && certification.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="border-slate-200 text-slate-600 bg-slate-50">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={() => navigate('/client')} variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl">
                          Aller à mon espace
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* COLONNE DROITE : LES ARGUMENTS */}
              <div className="lg:col-span-1 hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  
                  <Card className="bg-slate-900 text-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldCheck className="w-32 h-32" /></div>
                    <CardHeader className="pb-4 border-b border-white/10 relative z-10">
                      <CardTitle className="text-xl font-black flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        Pourquoi vendre ici ?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-base">Vente 3x plus rapide</h4>
                          <p className="text-sm font-medium text-slate-400 mt-1 leading-relaxed">Les annonces certifiées par l'IA partent en priorité absolue.</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                          <Trophy className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-base">Valorisation du prix</h4>
                          <p className="text-sm font-medium text-slate-400 mt-1 leading-relaxed">Justifiez votre prix ferme grâce à l'analyse de marché transparente.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-base">Génération par IA</h4>
                          <p className="text-sm font-medium text-slate-400 mt-1 leading-relaxed">Même si votre description est courte, l'IA en fera un argumentaire parfait.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="bg-indigo-50 border-indigo-100 rounded-3xl p-6 shadow-sm">
                    <AlertCircle className="h-6 w-6 text-indigo-600" />
                    <AlertTitle className="text-indigo-900 font-black ml-2 mb-1">Conseil IA</AlertTitle>
                    <AlertDescription className="text-sm font-medium text-indigo-700 ml-2 leading-relaxed">
                      L'honnêteté paye. Si vous avez une rayure ou des frais à prévoir, indiquez-le. L'algorithme augmente le Trust Score des annonces transparentes.
                    </AlertDescription>
                  </Alert>

                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
