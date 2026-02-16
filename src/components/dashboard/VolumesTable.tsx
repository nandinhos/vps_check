'use client';

import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useVolumes, useDeleteVolume } from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import type { Volume } from '@/domain/entities';

const columns: ColumnDef<Volume>[] = [
  {
    accessorKey: 'name',
    header: 'Volume',
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        <p className="font-medium text-sm">{row.original.name}</p>
        <p className="text-xs text-zinc-500 truncate">{row.original.driver}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      row.original.inUse ? (
        <Badge variant="info">Em uso</Badge>
      ) : (
        <Badge variant="warning">Órfão</Badge>
      )
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const deleteVolume = useDeleteVolume();
      const { toast } = useToast();
      const [loading, setLoading] = useState<string | null>(null);
      const [showConfirm, setShowConfirm] = useState(false);
      const [itemToDelete, setItemToDelete] = useState<{ name: string } | null>(null);
      
      const handleDelete = async () => {
        if (!itemToDelete) return;
        setLoading(itemToDelete.name);
        try {
          await deleteVolume.mutateAsync(itemToDelete.name);
          toast({
            title: 'Volume removido',
            description: `Volume ${itemToDelete.name} foi removido com sucesso`,
            variant: 'success',
          });
        } catch {
          toast({
            title: 'Erro',
            description: 'Falha ao remover volume',
            variant: 'destructive',
          });
        } finally {
          setLoading(null);
          setShowConfirm(false);
          setItemToDelete(null);
        }
      };

      const openConfirm = (name: string) => {
        setItemToDelete({ name });
        setShowConfirm(true);
      };

      return (
        !row.original.inUse && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem 
                  onClick={() => openConfirm(row.original.name)}
                  disabled={loading === row.original.name}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {loading === row.original.name ? 'Removendo...' : 'Remover'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover o volume "{itemToDelete?.name}"? 
                    Todos os dados serão perdidos permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      );
    },
  },
];

function VolumeTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function VolumesTable() {
  const { data: volumes, isLoading, error } = useVolumes();
  const table = useReactTable({
    data: volumes || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Volumes
            {volumes && (
              <Badge variant="secondary">{volumes.length}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <VolumeTableSkeleton />
        ) : error ? (
          <p className="text-red-500 text-sm">Erro ao carregar volumes</p>
        ) : (
          <div className="space-y-1">
            {table.getRowModel().rows.map(row => (
              <div
                key={row.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <div key={cell.id} className="flex-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
