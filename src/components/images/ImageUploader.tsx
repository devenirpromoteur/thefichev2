
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

interface ImageUploaderProps {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  buttonText?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  handleFileChange, 
  isUploading, 
  buttonText = "Importer",
  className = "" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-1 ${className}`}
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {buttonText}
      </Button>
    </>
  );
};

export default ImageUploader;
