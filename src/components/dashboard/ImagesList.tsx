'use client';

import { useState } from 'react';
import { useImages } from '@/lib/hooks/use-api';
import { ImageCard } from '@/components/dashboard/ImageCard';
import { SearchFilters } from '@/components/dashboard/SearchFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { label: 'Em uso', value: 'in_use' },
    { label: 'Não usada', value: 'unused' },
    { label: 'Órfã (Dangling)', value: 'dangling' },
  ];

  const filteredImages = (images || []).filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(search.toLowerCase()) || 
                         image.id.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'in_use') matchesStatus = image.inUse;
    else if (statusFilter === 'unused') matchesStatus = !image.inUse;
    else if (statusFilter === 'dangling') matchesStatus = image.isDangling;

    return matchesSearch && matchesStatus;
  });

  const hasResults = filteredImages.length > 0;

  if (isLoading) {
    return <ImageListSkeleton />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Erro ao carregar imagens</p>;
  }

  return (
    <div className="space-y-4">
      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={statusOptions}
        placeholder="Buscar por nome ou ID..."
      />

      {!hasResults ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
          <p className="text-muted-foreground">Nenhuma imagem encontrada para os filtros aplicados.</p>
          {(search || statusFilter !== 'all') && (
            <Button 
              variant="link" 
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredImages.map((image) => (
            <ImageCard key={image.id} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
