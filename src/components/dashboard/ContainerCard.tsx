'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Power,
  Container as ContainerIcon,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { useClearContainerLogs, useManageContainer } from '@/lib/hooks/use-api';
import { useErrorStore } from '@/lib/hooks/use-error-store';
import { useToast } from '@/components/ui/toast';
import { useHostAddress } from '@/lib/utils/network';
import { categorizePorts } from '@/lib/utils/ports';
import { PortLink } from '@/components/ui/port-link';
import type { Container } from '@/domain/entities';
import { formatSize } from '@/lib/utils';

interface ContainerCardProps {
  container: Container;
}

export function ContainerCard({ container }: ContainerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const clearLogs = useClearContainerLogs();
  const manageContainer = useManageContainer();
  const { addError, hasRecentErrors } = useErrorStore();
  const { toast } = useToast();
  const hostAddress = useHostAddress();

  const isRunning = container.state === 'running';
  const shortId = container.id.substring(0, 8);
  const createdDate = new Date(container.created * 1000);
  const now = new Date();
  const uptime = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
  const hasProblems = hasRecentErrors(container.id, 24);
  
  const portCategories = container.ports ? categorizePorts(container.ports) : { web: [], databases: [], other: [] };
  
  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete', label: string) => {
    if (action === 'delete') {
      setShowConfirm(true);
      return;
    }
    setLoading(action);
    try {
      await manageContainer.mutateAsync({ id: container.id, action });
      toast({
        title: `${label} executado`,
        description: `Container ${container.name} foi ${label.toLowerCase()}`,
        variant: 'success',
      });
    } catch (error: unknown) {
      const err = error as Error & { message: string; details?: string; suggestion?: string; stackTrace?: string };
      
      addError({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: new Date(),
        containerId: container.id,
        containerName: container.name,
        action,
        title: `${container.name} - ${label}`,
        message: err.message || `Falha ao ${label.toLowerCase()} container`,
        suggestion: err.suggestion || '',
        stackTrace: err.stackTrace || err.details || '',
        dockerError: err.details || '',
        apiEndpoint: `/api/containers/${container.id}`
      });
      
      toast({
        title: 'Erro',
        description: err.message || `Falha ao ${label.toLowerCase()} container`,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading('delete');
    try {
      await manageContainer.mutateAsync({ id: container.id, action: 'delete' });
      toast({
        title: 'Container removido',
        description: `Container ${container.name} foi removido`,
        variant: 'success',
      });
    } catch (error: unknown) {
      const err = error as Error & { message: string; details?: string; suggestion?: string; stackTrace?: string };
      
      addError({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: new Date(),
        containerId: container.id,
        containerName: container.name,
        action: 'delete',
        title: `${container.name} - Remover`,
        message: err.message || 'Falha ao remover container',
        suggestion: err.suggestion || '',
        stackTrace: err.stackTrace || err.details || '',
        dockerError: err.details || '',
        apiEndpoint: `/api/containers/${container.id}`
      });
      
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao remover container',
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
      <Card className={`overflow-hidden ${hasProblems ? 'border-yellow-500/50' : ''}`}>
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
            <div className="flex items-center gap-2">
              {hasProblems && (
                <span title="Problemas detectados nas últimas 24h">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </span>
              )}
              <div>
                <p className="font-medium">{container.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isRunning ? 'Running' : container.state} • ID: {shortId}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant={isRunning ? 'success' : container.state === 'exited' ? 'destructive' : 'secondary'}>
              {container.status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Gerenciar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-start gap-2">
                <ContainerIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Imagem</p>
                  <p className="text-sm font-medium truncate max-w-[150px]" title={container.image}>
                    {container.image}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Logs</p>
                  <p className={`text-sm font-medium ${container.logSize > 100 * 1024 * 1024 ? 'text-destructive' : ''}`}>
                    {formatSize(container.logSize)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criado</p>
                  <p className="text-sm font-medium">
                    {formatUptime(uptime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Portas Expostas */}
            {container.ports && container.ports.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3">🔌 Portas de Acesso</h4>
                
                {portCategories.web.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">🌐 Interfaces Web</p>
                    <div className="space-y-1">
                      {container.ports
                        .filter(p => portCategories.web.includes(p.containerPort))
                        .map((port, idx) => (
                          <PortLink
                            key={idx}
                            hostPort={port.hostPort}
                            containerPort={port.containerPort}
                            host={hostAddress}
                          />
                        ))}
                    </div>
                  </div>
                )}
                
                {portCategories.databases.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">🗄️ Bancos de Dados</p>
                    <div className="space-y-1">
                      {container.ports
                        .filter(p => portCategories.databases.includes(p.containerPort))
                        .map((port, idx) => (
                          <PortLink
                            key={idx}
                            hostPort={port.hostPort}
                            containerPort={port.containerPort}
                            host={hostAddress}
                          />
                        ))}
                    </div>
                  </div>
                )}
                
                {portCategories.other.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">🔧 Outras Portas</p>
                    <div className="space-y-1">
                      {container.ports
                        .filter(p => portCategories.other.includes(p.containerPort))
                        .map((port, idx) => (
                          <PortLink
                            key={idx}
                            hostPort={port.hostPort}
                            containerPort={port.containerPort}
                            host={hostAddress}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {!isRunning && (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleAction('start', 'Iniciar')}
                  disabled={loading === 'start'}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {loading === 'start' ? 'Iniciando...' : 'Iniciar'}
                </Button>
              )}
              {isRunning && (
                <>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleAction('stop', 'Parar')}
                    disabled={loading === 'stop'}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    {loading === 'stop' ? 'Parando...' : 'Parar'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleAction('restart', 'Reiniciar')}
                    disabled={loading === 'restart'}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {loading === 'restart' ? 'Reiniciando...' : 'Reiniciar'}
                  </Button>
                </>
              )}
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={loading === 'delete'}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {loading === 'delete' ? 'Removendo...' : 'Remover'}
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
              Tem certeza que deseja remover o container &quot;{container.name}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
