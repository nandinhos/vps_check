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
import { useImages, useDeleteImage } from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import type { Image } from '@/domain/entities';
import { formatSize } from '@/lib/utils';

const columns: ColumnDef<Image>[] = [
  {
    accessorKey: 'name',
    header: 'Imagem',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{(row.original.name || 'Sem nome').split(':')[0]}</p>
        <p className="text-xs text-zinc-500 italic">{row.original.tag || 'N/A'}</p>
      </div>
    ),
  },
  {
    accessorKey: 'size',
    header: 'Tamanho',
    cell: ({ row }) => formatSize(row.original.size),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex gap-2">
        {row.original.isDangling && <Badge variant="warning">Órfã</Badge>}
        {!row.original.inUse && <Badge variant="outline">S/ Uso</Badge>}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const deleteImage = useDeleteImage();
      const { toast } = useToast();
      const [loading, setLoading] = useState<string | null>(null);
      const [showConfirm, setShowConfirm] = useState(false);
      const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
      
      const handleDelete = async () => {
        if (!itemToDelete) return;
        setLoading(itemToDelete.id);
        try {
          await deleteImage.mutateAsync(itemToDelete.id);
          toast({
            title: 'Imagem removida',
            description: `Imagem ${itemToDelete.name} foi removida com sucesso`,
            variant: 'success',
          });
        } catch {
          toast({
            title: 'Erro',
            description: 'Falha ao remover imagem',
            variant: 'destructive',
          });
        } finally {
          setLoading(null);
          setShowConfirm(false);
          setItemToDelete(null);
        }
      };

      const openConfirm = (id: string, name: string) => {
        setItemToDelete({ id, name });
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
                  onClick={() => openConfirm(row.original.id, row.original.name)}
                  disabled={loading === row.original.id}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {loading === row.original.id ? 'Removendo...' : 'Remover'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover a imagem "{itemToDelete?.name}"? 
                    Esta ação não pode ser desfeita.
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

function ImageTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ImagesTable() {
  const { data: images, isLoading, error } = useImages();
  const table = useReactTable({
    data: images || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Imagens Docker
            {images && (
              <Badge variant="secondary">{images.length}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ImageTableSkeleton />
        ) : error ? (
          <p className="text-red-500 text-sm">Erro ao carregar imagens</p>
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
