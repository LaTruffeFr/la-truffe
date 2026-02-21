import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { 
  Car, Calendar, Gauge, ShieldCheck, Sparkles, 
  ArrowLeft, Mail, Phone, Loader2, Star, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Correct';
  return 'À vérifier';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-amber-400 to-orange-500';
  return 'from-red-400 to-red-600';
}

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: car, isLoading, error } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const isEmail = car?.seller_contact?.includes('@');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Annonce introuvable</h2>
          <p className="text-slate-500 mb-6">Ce véhicule n'existe pas ou a été retiré de la vente.</p>
          <Link to="/annonces">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Retour aux annonces</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link to="/annonces" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux annonces
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Image */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-200 shadow-xl aspect-[16/10]">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Car className="w-20 h-20" />
                </div>
              )}
              {/* AI Badge overlay */}
              <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-4 h-4" /> CERTIFIÉ IA
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Description du vendeur</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{car.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Info panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & quick specs */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {car.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                {car.year && (
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {car.year}</span>
                )}
                {car.mileage != null && (
                  <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {car.mileage.toLocaleString()} km</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Prix demandé</p>
              <p className="text-4xl font-black text-green-700">{car.price?.toLocaleString()} €</p>
            </div>

            {/* AI Certification Block */}
            {car.ai_score != null && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                {/* Score header */}
                <div className={`bg-gradient-to-r ${getScoreBg(car.ai_score)} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-2xl font-black">{car.ai_score}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium opacity-90">Score La Truffe</p>
                        <p className="text-lg font-bold">{getScoreLabel(car.ai_score)}</p>
                      </div>
                    </div>
                    <ShieldCheck className="w-8 h-8 opacity-60" />
                  </div>
                </div>

                <div className="bg-white p-5 space-y-4">
                  {/* Tags */}
                  {car.ai_tags && car.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {car.ai_tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* AI Opinion */}
                  {car.ai_avis && (
                    <>
                      <Separator />
                      <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-800">L'avis de notre IA experte</span>
                        </div>
                        <p className="text-sm text-slate-700 italic leading-relaxed">"{car.ai_avis}"</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Contact Button */}
            {car.seller_contact && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="xl" className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg">
                    {isEmail ? <Mail className="w-5 h-5 mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
                    Contacter le vendeur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Coordonnées du vendeur</DialogTitle>
                    <DialogDescription>
                      Contactez directement le vendeur pour organiser une visite ou poser vos questions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      {isEmail ? <Mail className="w-6 h-6 text-green-600" /> : <Phone className="w-6 h-6 text-green-600" />}
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">
                          {isEmail ? 'Email' : 'Téléphone'}
                        </p>
                        <p className="text-lg font-bold text-slate-900">{car.seller_contact}</p>
                      </div>
                    </div>
                    {isEmail ? (
                      <a href={`mailto:${car.seller_contact}?subject=Intéressé par votre ${car.title}`} className="block">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Mail className="w-4 h-4 mr-2" /> Envoyer un email
                        </Button>
                      </a>
                    ) : (
                      <a href={`tel:${car.seller_contact}`} className="block">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Phone className="w-4 h-4 mr-2" /> Appeler
                        </Button>
                      </a>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: ShieldCheck, label: 'Vérifié IA' },
                { icon: Star, label: 'Certifié' },
                { icon: Sparkles, label: 'Score fiable' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <Icon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
