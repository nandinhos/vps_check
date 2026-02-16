'use client';

import { useImages } from '@/lib/hooks/use-api';
import { ImageCard } from '@/components/dashboard/ImageCard';
import { Skeleton } from '@/components/ui/skeleton';

function ImageListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ImagesList() {
  const { data: images, isLoading, error } = useImages();

  if (isLoading) {
    return <ImageListSkeleton />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Erro ao carregar imagens</p>;
  }

  if (!images || images.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Nenhuma imagem encontrada</p>;
  }

  return (
    <div className="space-y-3">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
}
