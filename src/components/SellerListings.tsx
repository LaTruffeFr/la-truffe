import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit2, Trash2, Plus, Loader2, AlertCircle, Eye, 
  ExternalLink, Car, MapPin, DollarSign, Gauge, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ListingPhotoGallery } from '@/components/ListingPhotoGallery';
import { ListingAuditTrail } from '@/components/ListingAuditTrail';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CarListing {
  id: string;
  title: string;
  description: string;
  price: number;
  mileage: number;
  year: number;
  image_url?: string;
  seller_contact: string;
  is_active?: boolean;
  created_at: string;
  ai_score?: number;
}

interface SellerListingsProps {
  userId: string;
}

export function SellerListings({ userId }: SellerListingsProps) {
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'history'>('details');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    mileage: '',
    year: '',
    seller_contact: '',
  });

  // Charger les annonces du vendeur
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data as unknown as CarListing[]) || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les annonces.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchListings();
  }, [userId]);

  // Ouvrir le formulaire d'édition
  const handleEdit = (listing: CarListing) => {
    setEditingId(listing.id);
    setActiveTab('details');
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      price: listing.price?.toString() || '',
      mileage: listing.mileage?.toString() || '',
      year: listing.year?.toString() || '',
      seller_contact: listing.seller_contact || '',
    });
    setIsDialogOpen(true);
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('cars')
        .update({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          mileage: Number(formData.mileage),
          year: Number(formData.year),
          seller_contact: formData.seller_contact,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Succès ! ✅',
        description: 'Votre annonce a été mise à jour.',
        className: 'bg-green-600 text-white border-0',
      });

      setIsDialogOpen(false);
      setEditingId(null);
      fetchListings();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'annonce.',
      });
    }
  };

  // Supprimer une annonce
  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', deletingId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Suppression réussie ✅',
        description: 'Votre annonce a été supprimée.',
        className: 'bg-green-600 text-white border-0',
      });

      setDeletingId(null);
      fetchListings();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'annonce.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Car className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground text-center mb-4">
            Vous n'avez pas encore d'annonces. <br />
            <span className="text-sm">Créez votre première annonce pour la vendre !</span>
          </p>
          <Button variant="default" size="sm" onClick={() => window.location.href = '/vendre/formulaire'}>
            <Plus className="w-4 h-4 mr-2" /> Créer une annonce
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          Mes annonces ({listings.length})
        </h3>
        <Button 
          variant="default" 
          size="sm"
          onClick={() => window.location.href = '/vendre/formulaire'}
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvelle annonce
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            {listing.image_url && (
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {listing.ai_score && (
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    Score: {listing.ai_score}/100
                  </Badge>
                )}
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
              <p className="text-2xl font-bold text-primary mt-2">
                {listing.price.toLocaleString('fr-FR')} €
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="w-4 h-4" />
                  <span>{listing.mileage?.toLocaleString('fr-FR')} km</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="w-4 h-4" />
                  <span>{listing.year}</span>
                </div>
              </div>

              {/* Description (truncated) */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {listing.description}
              </p>

              {/* Contact */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Contact :</p>
                <p className="text-sm font-medium truncate">{listing.seller_contact}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 pt-4">
                <Dialog open={isDialogOpen && editingId === listing.id} onOpenChange={(open) => {
                  if (!open) setEditingId(null);
                  setIsDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9"
                      onClick={() => handleEdit(listing)}
                    >
                      <Edit2 className="w-4 h-4 md:mr-1.5" />
                      <span className="hidden md:inline">Modifier</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Gérer l'annonce</DialogTitle>
                      <DialogDescription>
                        Modifiez les détails, photos et consultez l'historique
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 border-b">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'details'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => setActiveTab('photos')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'photos'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'history'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Historique
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4 space-y-4">
                      {/* Details Tab */}
                      {activeTab === 'details' && (
                        <>
                          <div>
                            <Label htmlFor="title" className="text-sm">Titre</Label>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Marque Modèle Année"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="year" className="text-sm">Année</Label>
                              <Input
                                id="year"
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                placeholder="2020"
                              />
                            </div>

                            <div>
                              <Label htmlFor="mileage" className="text-sm">Kilométrage</Label>
                              <Input
                                id="mileage"
                                type="number"
                                value={formData.mileage}
                                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                placeholder="100000"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="price" className="text-sm">Prix (€)</Label>
                            <Input
                              id="price"
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              placeholder="25000"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description" className="text-sm">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Décrivez votre véhicule..."
                              rows={4}
                            />
                          </div>

                          <div>
                            <Label htmlFor="contact" className="text-sm">Moyen de contact</Label>
                            <Input
                              id="contact"
                              value={formData.seller_contact}
                              onChange={(e) => setFormData({ ...formData, seller_contact: e.target.value })}
                              placeholder="Téléphone ou email"
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setEditingId(null);
                              }}
                            >
                              Annuler
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={handleSave}
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Sauvegarder
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Photos Tab */}
                      {activeTab === 'photos' && editingId && (
                        <div className="pt-4">
                          <ListingPhotoGallery 
                            listingId={editingId}
                            onPhotosChanged={() => {
                              // Optionally refresh listings
                            }}
                          />
                        </div>
                      )}

                      {/* History Tab */}
                      {activeTab === 'history' && editingId && (
                        <div className="pt-4">
                          <ListingAuditTrail listingId={editingId} />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9"
                  onClick={() => window.open(`/annonce/${listing.id}`, '_blank')}
                >
                  <Eye className="w-4 h-4 md:mr-1.5" />
                  <span className="hidden md:inline">Voir</span>
                </Button>

                <AlertDialog open={deletingId === listing.id} onOpenChange={(open) => {
                  if (!open) setDeletingId(null);
                }}>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="h-9"
                    onClick={() => setDeletingId(listing.id)}
                  >
                    <Trash2 className="w-4 h-4 md:mr-1.5" />
                    <span className="hidden md:inline">Supprimer</span>
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L'annonce "{listing.title}" sera définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
