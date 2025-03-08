
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Image as ImageIcon, MapPin, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const imageCategories = [
  { id: 'aerial', name: 'Vues aériennes', icon: MapPin },
  { id: 'street', name: 'Accès rue', icon: Home },
  { id: 'neighborhood', name: 'Voisinage', icon: MapPin },
  { id: 'photos', name: 'Photos du site', icon: ImageIcon },
];

const Images = () => {
  const [activeTab, setActiveTab] = useState('aerial');
  const [images, setImages] = useState<{ [key: string]: { id: string, url: string, name: string }[] }>({
    aerial: [],
    street: [],
    neighborhood: [],
    photos: [],
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newImages = [...files].map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setImages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], ...newImages]
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(img => img.id !== id)
    }));
  };

  return (
    <PageLayout>
      <div className="animate-enter">
        <h1 className="text-4xl font-bold mb-2">Importation d'images</h1>
        <p className="text-lg text-gray-600 mb-8">
          Importez et organisez les visuels de votre projet immobilier
        </p>

        <Tabs 
          defaultValue="aerial" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent">
            {imageCategories.map(category => (
              <TabsTrigger 
                key={category.id}
                value={category.id}
                className={cn(
                  "data-[state=active]:bg-brand data-[state=active]:text-white border border-gray-200 shadow-sm",
                  "flex items-center gap-2 p-3"
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {imageCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                      isDragging ? "border-brand bg-brand/5" : "border-gray-300 hover:border-gray-400"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById(`file-upload-${category.id}`)?.click()}
                  >
                    <input
                      id={`file-upload-${category.id}`}
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Déposez vos images ici</h3>
                    <p className="text-gray-500 mb-4">ou cliquez pour parcourir</p>
                    <Button variant="outline" className="pointer-events-none opacity-80">
                      Parcourir mes fichiers
                    </Button>
                  </div>

                  {/* Image grid */}
                  {images[category.id].length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Images importées ({images[category.id].length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images[category.id].map(image => (
                          <div key={image.id} className="group relative rounded-lg overflow-hidden border border-gray-200 aspect-square">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(image.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs truncate">
                              {image.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Images;
