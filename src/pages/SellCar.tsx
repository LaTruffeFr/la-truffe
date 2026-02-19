import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { scoreSingleCar } from '@/lib/vehicleAnalysis';
import Header from '@/components/Header'; // 👈 AJOUT DE L'IMPORT DU HEADER
import { 
  Loader2, CheckCircle, Upload, Car, ShieldCheck, 
  Zap, Trophy, AlertCircle, Sparkles, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function SellCar() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    marque: '', modele: '', year: '', mileage: '', price: '', description: '', contact: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [certification, setCertification] = useState<any>(null);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleImage = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!imageFile) return alert("Une photo est obligatoire pour l'analyse IA !");
    if (!formData.contact) return alert("Indiquez un moyen de contact.");
    
    setLoading(true);
    
    try {
      setLoadingStep("🧠 Analyse IA du véhicule en cours...");
      const aiResult = scoreSingleCar({
        marque: formData.marque,
        modele: formData.modele,
        prix: Number(formData.price),
        kilometrage: Number(formData.mileage),
        annee: Number(formData.year),
        description: formData.description,
      });
      
      if (!aiResult) throw new Error("L'IA n'a pas pu analyser le véhicule.");
      setCertification(aiResult);

      setLoadingStep("☁️ Sécurisation de la photo...");
      const fileName = `${Date.now()}_${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('user-car-photos')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user-car-photos')
        .getPublicUrl(fileName);

      setLoadingStep("📝 Création de l'annonce certifiée...");
      const { error: dbError } = await supabase.from('cars' as any).insert({
        title: `${formData.marque} ${formData.modele}`,
        description: formData.description,
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        year: Number(formData.year),
        image_url: publicUrlData.publicUrl,
        seller_contact: formData.contact,
        is_user_listing: true,
        ai_score: aiResult.score,
        ai_avis: aiResult.avis,
        ai_tags: aiResult.tags
      });

      if (dbError) throw dbError;
      setStep(3); 

    } catch (error: any) {
      console.error(error);
      alert("Erreur : " + (error.message || "Une erreur inconnue est survenue"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 👇 AJOUT DU COMPOSANT HEADER ICI */}
      <Header /> 
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* HEADER DE LA PAGE */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300 text-sm font-medium text-green-700 mb-4">
              ✨ Étape 2: Dépôt de l'annonce
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
              Créez votre annonce
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Notre IA analyse votre véhicule et crée un rapport détaillé pour attirer les bons acheteurs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLONNE GAUCHE : FORMULAIRE */}
            <div className="lg:col-span-2 space-y-8">
              {step === 1 && (
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Car className="w-6 h-6 text-green-600"/> Informations du véhicule
                    </CardTitle>
                    <CardDescription>
                      Remplissez ce formulaire pour obtenir votre certification LaTruffe.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="marque">Marque</Label>
                        <Input id="marque" name="marque" placeholder="Ex: Audi" onChange={handleChange} className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modele">Modèle</Label>
                        <Input id="modele" name="modele" placeholder="Ex: RS3 Sportback" onChange={handleChange} className="bg-slate-50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="year">Année</Label>
                        <Input id="year" name="year" type="number" placeholder="2020" onChange={handleChange} className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mileage">Kilométrage</Label>
                        <div className="relative">
                          <Input id="mileage" name="mileage" type="number" placeholder="45000" onChange={handleChange} className="bg-slate-50 pr-8" />
                          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">KM</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix souhaité</Label>
                        <div className="relative">
                          <Input id="price" name="price" type="number" placeholder="35000" onChange={handleChange} className="bg-slate-50 pr-8 font-semibold text-green-700" />
                          <span className="absolute right-3 top-2.5 text-gray-500 font-bold">€</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description & Options</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Dites-nous tout : Options, état des pneus, entretiens récents, défauts..." 
                        className="h-32 bg-slate-50"
                        onChange={handleChange} 
                      />
                      <p className="text-xs text-slate-500 text-right">Plus vous êtes précis, meilleur sera votre score.</p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Photo pour l'analyse IA
                      </Label>
                      
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group relative">
                          <input 
                            type="file" 
                            onChange={handleImage} 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            id="img-upload" 
                          />
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">Cliquez ou glissez une photo ici</p>
                              <p className="text-sm text-slate-500 mt-1">L'IA analysera la carrosserie et l'état général.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border-2 border-green-500 shadow-lg group">
                          <img src={imagePreview} alt="Aperçu" className="w-full h-64 object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="sm" onClick={removeImage} className="gap-2">
                              <X className="w-4 h-4" /> Changer la photo
                            </Button>
                          </div>
                          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Photo prête
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Votre Email ou Téléphone</Label>
                      <Input id="contact" name="contact" placeholder="pour que les acheteurs vous contactent" onChange={handleChange} className="bg-slate-50" />
                    </div>

                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading} 
                      className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.01]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                          <span className="text-slate-200">{loadingStep}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          ✨ Certifier & Publier mon annonce
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 3 && certification && (
                <Card className="border-0 shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50 pointer-events-none" />
                  
                  <CardContent className="pt-12 pb-12 px-8 text-center relative z-10">
                    <div className="mb-8 inline-flex p-4 bg-green-100 rounded-full ring-8 ring-green-50 animate-in zoom-in duration-500">
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    
                    <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Annonce Certifiée !</h2>
                    <p className="text-lg text-slate-600 mb-10">Votre véhicule a été analysé et validé par LaTruffe.</p>

                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      
                      <div className="flex flex-col justify-center items-center border-r border-slate-100 pr-8">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">Score LaTruffe</span>
                        <div className={`text-7xl font-black ${certification.score > 75 ? 'text-green-600' : 'text-amber-500'}`}>
                          {certification.score}
                          <span className="text-2xl text-slate-300 font-medium">/100</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          {certification.score > 80 && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> PÉPITE
                            </span>
                          )}
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VÉRIFIÉ
                          </span>
                        </div>
                      </div>

                      <div className="pl-4 flex flex-col justify-center">
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" /> L'avis de l'Expert IA
                        </h3>
                        <p className="text-slate-600 italic leading-relaxed">"{certification.avis}"</p>
                        
                        <div className="mt-6 flex flex-wrap gap-2">
                          {certification.tags && certification.tags.map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-center gap-4">
                      <Button onClick={() => window.location.href = '/'} variant="outline" className="h-12 px-8">
                        Retour à l'accueil
                      </Button>
                      <Button onClick={() => window.location.href = '/'} className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20">
                        Voir mon annonce en ligne
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* COLONNE DROITE : ARGUMENTS */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                
                <Card className="bg-slate-900 text-white border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-400" />
                      Pourquoi certifier ?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Vente 3x plus rapide</h4>
                        <p className="text-xs text-slate-400 mt-1">Les annonces certifiées inspirent confiance et partent en priorité.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Valorisation du prix</h4>
                        <p className="text-xs text-slate-400 mt-1">Justifiez votre prix grâce au score IA et à l'analyse de marché.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Transparence Totale</h4>
                        <p className="text-xs text-slate-400 mt-1">L'acheteur a accès au rapport complet. Plus de négociations inutiles.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-white border-blue-100 shadow-sm">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 font-bold">Conseil Photo</AlertTitle>
                  <AlertDescription className="text-xs text-blue-600 mt-1">
                    Prenez une photo de 3/4 avant avec une bonne lumière. Une voiture propre augmente le score IA de 5 à 10 points !
                  </AlertDescription>
                </Alert>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}