
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AerialPhotoProps {
  showImage: boolean;
  setShowImage: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AerialPhoto: React.FC<AerialPhotoProps> = ({ showImage, setShowImage }) => {
  const { toast } = useToast();

  const handleImageSelection = () => {
    toast({
      title: "Sélection d'image", 
      description: "Fonctionnalité de changement d'image à intégrer"
    });
  };

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
          <div className="bg-gray-100 rounded-md w-full h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Photo aérienne du projet</p>
              <p className="text-sm">(Placez ici une photo du module Images)</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
