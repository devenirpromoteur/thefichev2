
import React from 'react';
import { ImageItem } from './ImageGallery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImagePreviewProps {
  image: ImageItem;
  isSelected: boolean;
  onClick: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, isSelected, onClick }) => {
  const formattedDate = image.uploadDate 
    ? format(new Date(image.uploadDate), 'dd MMM yyyy', { locale: fr })
    : '';

  return (
    <div 
      className={`
        relative border rounded-lg overflow-hidden transition-all duration-200
        ${isSelected ? 'ring-2 ring-brand ring-offset-2' : 'hover:shadow-md'}
      `}
      onClick={onClick}
    >
      <div className="aspect-video relative">
        <img 
          src={image.url} 
          alt={image.name} 
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-2 bg-white">
        <p className="text-sm truncate font-medium">{image.name}</p>
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-brand/10 border-2 border-brand rounded-lg"></div>
      )}
    </div>
  );
};

export default ImagePreview;
