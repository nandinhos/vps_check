'use client';

import { useState } from 'react';
import { useVolumes } from '@/lib/hooks/use-api';
import { VolumeCard } from '@/components/dashboard/VolumeCard';
import { SearchFilters } from '@/components/dashboard/SearchFilters';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive } from 'lucide-react';

function VolumeListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse bg-muted/20">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VolumesList() {
  const { data: volumes, isLoading, error } = useVolumes();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { label: 'Órfãos', value: 'orphan' },
    { label: 'Em uso', value: 'in_use' },
  ];

  if (isLoading) {
    return <VolumeListSkeleton />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Erro ao carregar volumes</p>;
  }

  const filteredVolumes = (volumes || []).filter(volume => {
    const matchesSearch = volume.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'orphan' && !volume.inUse) ||
                         (statusFilter === 'in_use' && volume.inUse);
    return matchesSearch && matchesStatus;
  });

  if (!volumes || volumes.length === 0) {
    return (
      <EmptyState
        icon={HardDrive}
        title="Nenhum volume encontrado"
        description="Não há volumes Docker registrados nesta VPS."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={statusOptions}
        placeholder="Buscar por nome do volume..."
      />

      {filteredVolumes.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="Nenhum resultado"
          description="Não encontramos volumes para os filtros aplicados."
          action={{
            label: "Limpar filtros",
            onClick: () => { setSearch(''); setStatusFilter('all'); }
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredVolumes.map((volume) => (
            <VolumeCard key={volume.name} volume={volume} />
          ))}
        </div>
      )}
    </div>
  );
}
