'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  HardDrive,
  Tag,
  Clock,
  Container
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
import { useDeleteImage } from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import type { Image } from '@/domain/entities';
import { formatSize } from '@/lib/utils';

interface ImageCardProps {
  image: Image;
}

export function ImageCard({ image }: ImageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const deleteImage = useDeleteImage();
  const { toast } = useToast();

  const shortId = image.id.substring(0, 12);
  const createdDate = new Date(image.created * 1000);
  const now = new Date();
  const age = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
  
  const formatAge = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 2592000)}M`;
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteImage.mutateAsync(image.id);
      toast({
        title: 'Imagem removida',
        description: `Imagem ${image.name} foi removida`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao remover imagem',
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
              <p className="font-medium truncate max-w-[200px]" title={image.name}>
                {image.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {shortId} • {image.tag}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {image.containers && image.containers.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 text-blue-500 rounded">
                  <Container className="h-3 w-3" />
                  {image.containers.length}
                </span>
                <span className="text-xs text-muted-foreground hidden md:inline">
                  {image.containers.map(c => c.name).join(', ')}
                </span>
              </div>
            )}
            <Badge variant={image.isDangling ? 'warning' : image.inUse ? 'success' : 'secondary'}>
              {image.isDangling ? 'Orfã' : image.inUse ? 'Em uso' : 'Não usada'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tamanho</p>
                  <p className="text-sm font-medium">{formatSize(image.size)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tag</p>
                  <p className="text-sm font-medium">{image.tag}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criado há</p>
                  <p className="text-sm font-medium">{formatAge(age)}</p>
                </div>
              </div>
            </div>

            {image.containers && image.containers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Container className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Containers usando esta imagem</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {image.containers.map((container) => (
                    <Badge key={container.id} variant="outline" className="text-xs">
                      {container.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={loading}
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
              Tem certeza que deseja remover a imagem &quot;{image.name}:{image.tag}&quot;? 
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
