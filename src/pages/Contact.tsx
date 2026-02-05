import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, MessageSquare, Send
} from 'lucide-react';
import { Footer } from '@/components/landing';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulation d'envoi
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Message envoyé",
        description: "Notre équipe vous répondra sous 24h.",
      });
      // Reset form (optionnel)
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-900">
      
      <Header activeLink="contact" />

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Contactez-nous
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Tu as des questions concernant notre produit, ta commande ou une question d'ordre général ? Dis-nous comment nous pouvons t'aider.
          </p>
        </div>
      </section>

      {/* --- CONTACT FORM SECTION --- */}
      <section className="py-20 bg-slate-50 -mt-10 rounded-t-[3rem] relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Formulaire de contact</h2>
                <p className="text-slate-500 mt-2">Remplis ce formulaire et nous répondrons à ta demande dans les plus brefs délais.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Votre e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="email" type="email" placeholder="nom@exemple.com" className="pl-10 h-12 bg-slate-50 border-slate-200" required />
                  </div>
                </div>

                {/* Objet (Select) */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-slate-700">Objet</Label>
                  <Select required>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="report_missing">Je n'ai pas reçu le rapport</SelectItem>
                      <SelectItem value="invoice">J'ai besoin d'une facture</SelectItem>
                      <SelectItem value="business">Coopération commerciale</SelectItem>
                      <SelectItem value="claim">Réclamation</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="collab">Collaboration YouTube/TikTok</SelectItem>
                      <SelectItem value="other">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* VIN / Reference */}
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-sm font-medium text-slate-700">Référence véhicule (Optionnel)</Label>
                  <Input id="vin" placeholder="Numéro VIN ou Marque/Modèle" className="h-12 bg-slate-50 border-slate-200" />
                  <p className="text-xs text-slate-500">Le numéro d'identification (VIN) de la voiture que tu as vérifiée, si applicable.</p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-slate-700">Votre message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Détaillez votre demande ici..." 
                    className="min-h-[150px] bg-slate-50 border-slate-200 resize-none p-4" 
                    required 
                  />
                </div>

                {/* Privacy Checkbox */}
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox id="terms" required className="mt-1" />
                  <Label htmlFor="terms" className="text-sm text-slate-500 leading-normal font-normal cursor-pointer">
                    J'ai lu, compris et accepté le contenu de la <span className="text-primary underline">politique de confidentialité</span> et je consens au traitement de mes données dans le cadre de ma requête.
                  </Label>
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg" disabled={isLoading}>
                  {isLoading ? "Envoi en cours..." : (
                    <span className="flex items-center gap-2">
                      Envoyer le message <Send className="w-4 h-4" />
                    </span>
                  )}
                </Button>

              </form>
            </div>
            
            {/* Contact Info Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 text-center text-sm text-slate-500">
              <p>Besoin d'une réponse immédiate ? Consultez notre <Link to="/faq" className="text-primary font-semibold hover:underline">FAQ</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;