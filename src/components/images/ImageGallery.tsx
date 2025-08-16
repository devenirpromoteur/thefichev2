
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Image, ImagePlus, Trash2, MapPin } from 'lucide-react';
import ImageUploader from './ImageUploader';
import ImagePreview from './ImagePreview';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  category: string;
  uploadDate: string;
  ficheId?: string;
}

interface ImageGalleryProps {
  ficheId?: string;
  readOnly?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ ficheId, readOnly = false }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('aerial');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Catégories d'images
  const categories = [
    { id: 'aerial', label: 'Vues aériennes', icon: Image },
    { id: 'street', label: 'Accès rue', icon: Image },
    { id: 'neighborhood', label: 'Voisinage', icon: Image },
    { id: 'site', label: 'Photos du site', icon: Image },
    { id: 'geoportail', label: 'Géoportail', icon: MapPin }
  ];

  useEffect(() => {
    // Chargement des images depuis le localStorage
    if (ficheId) {
      loadImages();
    }
  }, [ficheId]);

  const loadImages = () => {
    try {
      const storedImages = localStorage.getItem('projectImages');
      if (storedImages) {
        const allImages: ImageItem[] = JSON.parse(storedImages);
        // Filtrer les images par ficheId si celui-ci est fourni
        const filteredImages = ficheId 
          ? allImages.filter(img => img.ficheId === ficheId)
          : allImages;
        
        console.log(`Loaded ${filteredImages.length} images for ficheId ${ficheId}`);
        setImages(filteredImages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les images",
        variant: 'destructive',
      });
    }
  };

  const saveImages = (updatedImages: ImageItem[]) => {
    try {
      // Si nous avons un ficheId, nous devons mettre à jour uniquement les images de cette fiche
      // tout en préservant les autres images
      const storedImages = localStorage.getItem('projectImages');
      const allImages: ImageItem[] = storedImages ? JSON.parse(storedImages) : [];
      
      if (ficheId) {
        // Filtrer les images qui n'appartiennent pas à cette fiche
        const otherImages = allImages.filter(img => img.ficheId !== ficheId);
        
        // Fusionner avec les images mises à jour pour cette fiche
        const combinedImages = [...otherImages, ...updatedImages];
        localStorage.setItem('projectImages', JSON.stringify(combinedImages));
        console.log(`Saved ${updatedImages.length} images for ficheId ${ficheId}`);
      } else {
        // Pas de ficheId, nous sauvegardons simplement toutes les images
        localStorage.setItem('projectImages', JSON.stringify(updatedImages));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des images:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de sauvegarder les images",
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    const newImages: ImageItem[] = [];
    let loadedCount = 0;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const now = new Date();
        
        const newImage: ImageItem = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          url: imageUrl,
          name: file.name,
          category: activeTab,
          uploadDate: now.toISOString(),
          ficheId: ficheId
        };
        
        newImages.push(newImage);
        loadedCount++;
        
        if (loadedCount === files.length) {
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          saveImages(updatedImages);
          setIsUploading(false);
          
          toast({
            title: 'Succès',
            description: `${files.length} image(s) importée(s) avec succès`,
          });
        }
      };
      
      reader.onerror = () => {
        loadedCount++;
        toast({
          title: 'Erreur',
          description: `Impossible de lire le fichier ${file.name}`,
          variant: 'destructive',
        });
        
        if (loadedCount === files.length) {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (id: string) => {
    const updatedImages = images.filter(image => image.id !== id);
    setImages(updatedImages);
    saveImages(updatedImages);
    setSelectedImage(null);
    
    toast({
      title: 'Image supprimée',
      description: "L'image a été supprimée avec succès",
    });
  };

  const filteredImages = images.filter(image => image.category === activeTab);

  return (
    <div className="animate-enter opacity-0">
      <Card className="shadow-soft overflow-hidden">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-xl text-brand">Galerie d'images</CardTitle>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="p-4 bg-gray-50 border-b">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id}
                    value={category.id}
                    className="flex gap-2 items-center"
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">{category.label}</h3>
                
                {!readOnly && (
                  <div className="flex gap-2">
                    <ImageUploader 
                      isUploading={isUploading}
                      handleFileChange={handleFileChange}
                    />
                    
                    {selectedImage && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteImage(selectedImage)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {filteredImages.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 mb-2">Aucune image dans cette catégorie</p>
                  {!readOnly && (
                    <ImageUploader 
                      buttonText="Ajouter des images"
                      isUploading={isUploading}
                      handleFileChange={handleFileChange}
                      className="mx-auto"
                    />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredImages.map(image => (
                    <ImagePreview
                      key={image.id}
                      image={image}
                      isSelected={selectedImage === image.id}
                      onClick={() => setSelectedImage(selectedImage === image.id ? null : image.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default ImageGallery;
