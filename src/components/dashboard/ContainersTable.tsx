'use client';

import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { MoreHorizontal, Trash2, Play, Square, RotateCcw, Power } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
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
import { useContainers, useClearContainerLogs, useManageContainer } from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import type { Container } from '@/domain/entities';
import { formatSize } from '@/lib/utils';

const columns: ColumnDef<Container>[] = [
  {
    accessorKey: 'name',
    header: 'Container',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-zinc-500">{row.original.image}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const state = row.original.state;
      return (
        <Badge variant={state === 'running' ? 'success' : state === 'exited' ? 'destructive' : 'secondary'}>
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'logSize',
    header: 'Logs',
    cell: ({ row }) => {
      const size = row.original.logSize;
      return (
        <span className={size > 100 * 1024 * 1024 ? 'text-red-500 font-medium' : 'text-zinc-400'}>
          {formatSize(size)}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const clearLogs = useClearContainerLogs();
      const manageContainer = useManageContainer();
      const { toast } = useToast();
      const [loading, setLoading] = useState<string | null>(null);
      const [showConfirm, setShowConfirm] = useState(false);
      const [actionToConfirm, setActionToConfirm] = useState<{ type: string; label: string } | null>(null);
      
      const container = row.original;
      const isRunning = container.state === 'running';

      const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete', label: string) => {
        if (action === 'delete') {
          setActionToConfirm({ type: action, label });
          setShowConfirm(true);
          return;
        }
        setLoading(container.id);
        try {
          await manageContainer.mutateAsync({ id: container.id, action });
          toast({
            title: `${label} executado`,
            description: `Container ${container.name} foi ${label.toLowerCase()}`,
            variant: 'success',
          });
        } catch {
          toast({
            title: 'Erro',
            description: `Falha ao ${label.toLowerCase()} container`,
            variant: 'destructive',
          });
        } finally {
          setLoading(null);
        }
      };

      const handleConfirmDelete = async () => {
        setLoading(container.id);
        try {
          await manageContainer.mutateAsync({ id: container.id, action: 'delete' });
          toast({
            title: 'Container removido',
            description: `Container ${container.name} foi removido`,
            variant: 'success',
          });
        } catch {
          toast({
            title: 'Erro',
            description: 'Falha ao remover container',
            variant: 'destructive',
          });
        } finally {
          setLoading(null);
          setShowConfirm(false);
        }
      };

      const handleClearLogs = async () => {
        setLoading('logs');
        try {
          await clearLogs.mutateAsync(container.id);
          toast({
            title: 'Logs limpos',
            description: `Logs do container ${container.name} foram limpos`,
            variant: 'success',
          });
        } catch {
          toast({
            title: 'Erro',
            description: 'Falha ao limpar logs',
            variant: 'destructive',
          });
        } finally {
          setLoading(null);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              {!isRunning && (
                <DropdownMenuItem onClick={() => handleAction('start', 'Iniciar')}>
                  <Play className="mr-2 h-4 w-4 text-green-500" />
                  Iniciar
                </DropdownMenuItem>
              )}
              {isRunning && (
                <>
                  <DropdownMenuItem onClick={() => handleAction('stop', 'Parar')}>
                    <Square className="mr-2 h-4 w-4 text-yellow-500" />
                    Parar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('restart', 'Reiniciar')}>
                    <RotateCcw className="mr-2 h-4 w-4 text-blue-500" />
                    Reiniciar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleClearLogs} disabled={loading === 'logs'}>
                <Power className="mr-2 h-4 w-4 text-yellow-500" />
                {loading === 'logs' ? 'Limpando...' : 'Limpar Logs'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleAction('delete', 'Remover')}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o container "{container.name}"? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  },
];

function ContainerTableSkeleton() {
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

export function ContainersTable() {
  const { data: containers, isLoading, error } = useContainers();
  const table = useReactTable({
    data: containers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Containers
            {containers && (
              <Badge variant="secondary">{containers.length}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ContainerTableSkeleton />
        ) : error ? (
          <p className="text-red-500 text-sm">Erro ao carregar containers</p>
        ) : containers?.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">Nenhum container encontrado</p>
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
