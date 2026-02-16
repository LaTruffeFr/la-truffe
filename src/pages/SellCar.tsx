import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Vérifie que ce chemin est bon selon ton projet
import { certifyCar } from '../utils/aiCertifier';
import { Loader2, CheckCircle, Upload, Car } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Si tu utilises Shadcn
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SellCar() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marque: '', modele: '', year: '', mileage: '', price: '', description: '', contact: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [certification, setCertification] = useState<any>(null);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleImage = (e: any) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!imageFile) return alert("Photo obligatoire !");
    setLoading(true);

    try {
      // 1. IA
      const aiResult = await certifyCar(formData, imageFile);
      if (!aiResult) throw new Error("Erreur analyse IA");
      setCertification(aiResult);

      // 2. Storage
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-car-photos')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user-car-photos')
        .getPublicUrl(fileName);

      // 3. Base de données
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

    } catch (error) {
      console.error(error);
      alert("Erreur lors de la publication. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car className="text-primary"/> Vendre & Certifier mon véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="marque" placeholder="Marque" onChange={handleChange} />
              <Input name="modele" placeholder="Modèle" onChange={handleChange} />
              <Input name="year" type="number" placeholder="Année" onChange={handleChange} />
              <Input name="mileage" type="number" placeholder="Kilométrage" onChange={handleChange} />
            </div>
            <Input name="price" type="number" placeholder="Prix (€)" onChange={handleChange} />
            <Textarea name="description" placeholder="Description..." onChange={handleChange} className="h-32" />
            
            <div className="border-2 border-dashed p-6 text-center rounded-lg cursor-pointer hover:bg-muted/50">
              <input type="file" onChange={handleImage} accept="image/*" className="hidden" id="img-up" />
              <label htmlFor="img-up" className="cursor-pointer flex flex-col items-center">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span>{imageFile ? imageFile.name : "Glisser une photo (Obligatoire)"}</span>
              </label>
            </div>

            <Input name="contact" placeholder="Email ou Tél" onChange={handleChange} />

            <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-lg">
              {loading ? <><Loader2 className="mr-2 animate-spin"/> Certification IA en cours...</> : "Certifier & Publier"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && certification && (
        <Card className="border-green-500 border-2">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Annonce Certifiée !</h2>
            
            <div className="bg-secondary p-6 rounded-xl inline-block my-6">
              <div className="text-sm uppercase font-bold text-muted-foreground">Score LaTruffe</div>
              <div className={`text-6xl font-black ${certification.score > 75 ? 'text-green-600' : 'text-orange-500'}`}>
                {certification.score}/100
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-lg text-left mb-6">
              <p className="font-bold text-blue-800">🕵️ L'avis de l'IA :</p>
              <p className="text-blue-700 italic">"{certification.avis}"</p>
            </div>

            <Button onClick={() => window.location.href = '/'} variant="outline">Retour au site</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}