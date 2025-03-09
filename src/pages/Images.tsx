
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import ImageGallery from '@/components/images/ImageGallery';

export default function Images() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Images</h1>
          <p className="text-gray-500">Gérez les images de vos projets</p>
        </div>
        
        <ImageGallery />
      </div>
    </PageLayout>
  );
}
