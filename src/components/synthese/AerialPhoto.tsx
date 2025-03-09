
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageItem } from '@/components/images/ImageGallery';

interface AerialPhotoProps {
  showImage: boolean;
  setShowImage: React.Dispatch<React.SetStateAction<boolean>>;
  ficheId?: string;
}

export const AerialPhoto: React.FC<AerialPhotoProps> = ({ 
  showImage, 
  setShowImage,
  ficheId 
}) => {
  const { toast } = useToast();
  const [aerialImages, setAerialImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (ficheId) {
      loadImages();
    }
  }, [ficheId]);

  const loadImages = () => {
    try {
      const storedImages = localStorage.getItem('projectImages');
      if (storedImages) {
        const allImages: ImageItem[] = JSON.parse(storedImages);
        // Filtrer les images aériennes pour cette fiche
        const filteredImages = allImages.filter(
          img => img.ficheId === ficheId && img.category === 'aerial'
        );
        setAerialImages(filteredImages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
    }
  };

  const handleImageSelection = () => {
    if (aerialImages.length > 1) {
      // Passer à l'image suivante
      setSelectedImageIndex((selectedImageIndex + 1) % aerialImages.length);
      toast({
        title: "Image changée", 
        description: `Image ${selectedImageIndex + 1}/${aerialImages.length}`
      });
    } else {
      toast({
        title: "Pas d'autres images", 
        description: "Ajoutez plus d'images aériennes dans l'onglet Images"
      });
    }
  };

  const currentImage = aerialImages.length > 0 ? aerialImages[selectedImageIndex] : null;

  return (
    <Card className="border-l-4 border-l-brand">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Photo aérienne du projet</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowImage(!showImage)}
          >
            {showImage ? (
              <EyeOff className="h-4 w-4" /> 
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleImageSelection}
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {showImage && (
        <CardContent>
          {currentImage ? (
            <div className="w-full h-64 rounded-md overflow-hidden">
              <img 
                src={currentImage.url} 
                alt="Vue aérienne" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-md w-full h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune photo aérienne disponible</p>
                <p className="text-sm">Ajoutez des images dans l'onglet Images</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
