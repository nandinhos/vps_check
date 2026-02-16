'use client';

import { useVolumes } from '@/lib/hooks/use-api';
import { VolumeCard } from '@/components/dashboard/VolumeCard';
import { Skeleton } from '@/components/ui/skeleton';

function VolumeListSkeleton() {
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

export function VolumesList() {
  const { data: volumes, isLoading, error } = useVolumes();

  if (isLoading) {
    return <VolumeListSkeleton />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Erro ao carregar volumes</p>;
  }

  if (!volumes || volumes.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Nenhum volume encontrado</p>;
  }

  return (
    <div className="space-y-3">
      {volumes.map((volume) => (
        <VolumeCard key={volume.name} volume={volume} />
      ))}
    </div>
  );
}
