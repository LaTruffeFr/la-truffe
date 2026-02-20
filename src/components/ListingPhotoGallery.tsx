import { useEffect, useState } from "react";
import { Upload, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ListingPhoto {
  id: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
}

export function ListingPhotoGallery({
  listingId,
  onPhotosChanged,
}: {
  listingId: string;
  onPhotosChanged?: () => void;
}) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [listingId]);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("listing_photos")
        .select("*")
        .eq("listing_id", listingId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPhotos((data || []) as ListingPhoto[]);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les photos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${listingId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("user-car-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("user-car-photos")
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await (supabase as any)
          .from("listing_photos")
          .insert({
            listing_id: listingId,
            photo_url: publicUrl,
            display_order: photos.length + i,
            is_primary: photos.length === 0 && i === 0, // First photo is primary
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Succès",
        description: `${files.length} photo(s) téléchargée(s)`,
      });

      fetchPhotos();
      onPhotosChanged?.();
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader les photos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      // Update all photos for this listing
      const { error } = await (supabase as any)
        .from("listing_photos")
        .update({ is_primary: false })
        .eq("listing_id", listingId);

      if (error) throw error;

      // Set the selected photo as primary
      const { error: updateError } = await (supabase as any)
        .from("listing_photos")
        .update({ is_primary: true })
        .eq("id", photoId);

      if (updateError) throw updateError;

      fetchPhotos();
      toast({
        title: "Succès",
        description: "Photo principale mise à jour",
      });
    } catch (error) {
      console.error("Error setting primary photo:", error);
      toast({
        title: "Erreur",
        description: "Impossible de définir la photo principale",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("listing_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast({
        title: "Succès",
        description: "Photo supprimée",
      });
      onPhotosChanged?.();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin">📷</div>
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="photo-upload" className="block mb-2">
          <Button
            asChild
            disabled={isUploading}
            className="w-full"
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Téléchargement..." : "Ajouter des photos"}
            </span>
          </Button>
        </label>
        <input
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucune photo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                photo.is_primary
                  ? "border-blue-500 shadow-lg"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={photo.photo_url}
                alt="Listing photo"
                className="w-full h-40 object-cover"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!photo.is_primary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(photo.id)}
                    className="text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Principal
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {photo.is_primary && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
