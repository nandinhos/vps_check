'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  HardDrive,
  Database,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { useDeleteVolume } from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import type { Volume } from '@/domain/entities';

interface VolumeCardProps {
  volume: Volume;
}

export function VolumeCard({ volume }: VolumeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const deleteVolume = useDeleteVolume();
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteVolume.mutateAsync(volume.name);
      toast({
        title: 'Volume removido',
        description: `Volume ${volume.name} foi removido`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao remover volume',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <button className="p-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div>
              <p className="font-medium truncate max-w-[200px]" title={volume.name}>
                {volume.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Driver: {volume.driver}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant={volume.inUse ? 'success' : 'warning'}>
              {volume.inUse ? 'Em uso' : 'Órfão'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="text-destructive hover:text-destructive"
              disabled={volume.inUse}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="text-sm font-medium">{volume.driver}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mountpoint</p>
                  <p className="text-sm font-medium truncate max-w-[150px]" title={volume.mountpoint}>
                    {volume.mountpoint.split('/').pop() || volume.mountpoint}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={loading || volume.inUse}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {loading ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o volume &quot;{volume.name}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
