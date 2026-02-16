'use client';

import { useState } from 'react';
import { useContainers, useManageContainers } from '@/lib/hooks/use-api';
import { ContainerCard } from '@/components/dashboard/ContainerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, Folder, Play, Square, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useErrorStore } from '@/lib/hooks/use-error-store';
import { ErrorHistoryModal } from '@/components/ui/error-history-modal';
import type { Container } from '@/domain/entities';

interface ProjectGroup {
  name: string;
  containers: Container[];
}

function extractProjectName(containerName: string): string {
  const cleanName = containerName.replace(/^\//, '');
  const parts = cleanName.split('-');
  if (parts.length > 1) {
    return parts[0];
  }
  return 'outros';
}

function groupByProject(containers: Container[]): ProjectGroup[] {
  const groups: Record<string, Container[]> = {};
  
  containers.forEach(container => {
    const project = extractProjectName(container.name);
    if (!groups[project]) {
      groups[project] = [];
    }
    groups[project].push(container);
  });
  
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, containers]) => ({ name, containers }));
}

function ContainerListSkeleton() {
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

interface ProjectCardProps {
  project: ProjectGroup;
  defaultExpanded?: boolean;
}

function ProjectCard({ project, defaultExpanded = true }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState<string | null>(null);
  
  const runningCount = project.containers.filter(c => c.state === 'running').length;
  const stoppedCount = project.containers.filter(c => c.state === 'exited' || c.state === 'stopped').length;
  const pausedCount = project.containers.filter(c => c.state === 'paused').length;
  
  const manageContainers = useManageContainers();
  const { toast } = useToast();
  const { addError } = useErrorStore();

  const handleBulkAction = async (action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause', label: string) => {
    let containerIds: string[] = [];
    
    if (action === 'start') {
      containerIds = project.containers.filter(c => c.state !== 'running').map(c => c.id);
    } else if (action === 'stop') {
      containerIds = project.containers.filter(c => c.state === 'running').map(c => c.id);
    } else if (action === 'pause') {
      containerIds = project.containers.filter(c => c.state === 'running').map(c => c.id);
    } else if (action === 'unpause') {
      containerIds = project.containers.filter(c => c.state === 'paused').map(c => c.id);
    } else if (action === 'restart') {
      containerIds = project.containers.filter(c => c.state === 'running').map(c => c.id);
    }

    if (containerIds.length === 0) {
      toast({
        title: 'Nenhum container disponível',
        description: `Não há containers para ${label.toLowerCase()}`,
        variant: 'warning',
      });
      return;
    }

    setLoading(action);
    try {
      const result = await manageContainers.mutateAsync({ containerIds, action });
      
      const successCount = result.results?.filter((r: { success: boolean }) => r.success).length || containerIds.length;
      const failCount = result.results?.filter((r: { success: boolean }) => !r.success).length || 0;
      
      if (failCount > 0) {
        const failedDetails = result.results?.filter((r: { success: boolean }) => !r.success);
        
        addError({
          id: Math.random().toString(36).substring(2, 15),
          timestamp: new Date(),
          containerId: project.name,
          containerName: project.name,
          action: `bulk-${action}`,
          title: `${label} - ${failCount} falhas`,
          message: `${successCount} iniciados, ${failCount} falharam`,
          suggestion: 'Verifique os detalhes dos erros abaixo',
          stackTrace: failedDetails?.map((r: { id: string; error?: string }) => `Container: ${r.id}\nErro: ${r.error}`).join('\n\n') || '',
          dockerError: '',
          apiEndpoint: '/api/containers/bulk',
          isBulkError: true,
          failedContainers: failedDetails
        });
        
        toast({
          title: 'Erro',
          description: `${successCount} executados, ${failCount} falharam. Ver histórico para detalhes.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: `${label} executado`,
          description: `${containerIds.length} container(s) foram ${label.toLowerCase()}`,
          variant: 'success',
        });
      }
    } catch (error: unknown) {
      const err = error as Error & { message: string };
      
      addError({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: new Date(),
        containerId: project.name,
        containerName: project.name,
        action: `bulk-${action}`,
        title: `${label} - Erro`,
        message: err.message || `Falha ao ${label.toLowerCase()} containers`,
        suggestion: 'Tente novamente ou verifique os logs',
        stackTrace: err.stack || '',
        dockerError: err.message,
        apiEndpoint: '/api/containers/bulk',
        isBulkError: true
      });
      
      toast({
        title: 'Erro',
        description: err.message || `Falha ao ${label.toLowerCase()} containers`,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden shadow-sm">
      <div 
        className="flex items-center justify-between p-3 bg-primary/5 border-b border-border"
      >
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-primary/10 rounded transition-colors flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <button className="p-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <Folder className="h-4 w-4 text-primary" />
          <span className="font-semibold capitalize">{project.name}</span>
          <Badge variant="outline" className="ml-2">
            {project.containers.length} container{project.containers.length !== 1 ? 's' : ''}
          </Badge>
          {runningCount > 0 && (
            <Badge variant="success" className="ml-1">
              {runningCount} rodando{runningCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {pausedCount > 0 && (
            <Badge variant="warning" className="ml-1">
              {pausedCount} pausado{pausedCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {stoppedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => handleBulkAction('start', 'Iniciar Todos')}
              disabled={loading !== null}
            >
              {loading === 'start' ? (
                <RotateCcw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 text-green-500" />
              )}
            </Button>
          )}
          {runningCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleBulkAction('pause', 'Pausar Todos')}
                disabled={loading !== null}
              >
                {loading === 'pause' ? (
                  <RotateCcw className="h-3 w-3 animate-spin" />
                ) : (
                  <Pause className="h-3 w-3 text-yellow-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleBulkAction('stop', 'Parar Todos')}
                disabled={loading !== null}
              >
                {loading === 'stop' ? (
                  <RotateCcw className="h-3 w-3 animate-spin" />
                ) : (
                  <Square className="h-3 w-3 text-red-500" />
                )}
              </Button>
            </>
          )}
          {pausedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => handleBulkAction('unpause', 'Retomar Todos')}
              disabled={loading !== null}
            >
              {loading === 'unpause' ? (
                <RotateCcw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 text-green-500" />
              )}
            </Button>
          )}
          {runningCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => handleBulkAction('restart', 'Reiniciar Todos')}
              disabled={loading !== null}
            >
              {loading === 'restart' ? (
                <RotateCcw className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 text-blue-500" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 border-t border-border bg-muted/20 space-y-2">
          {project.containers.map((container) => (
            <ContainerCard key={container.id} container={container} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContainersList() {
  const { data: containers, isLoading, error } = useContainers();
  const { errors } = useErrorStore();
  const [showErrorModal, setShowErrorModal] = useState(false);

  if (isLoading) {
    return <ContainerListSkeleton />;
  }

  if (error) {
    return <p className="text-destructive text-sm">Erro ao carregar containers</p>;
  }

  if (!containers || containers.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Nenhum container encontrado</p>;
  }

  const projects = groupByProject(containers);

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowErrorModal(true)}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Ver Histórico de Erros ({errors.length})
          </Button>
        </div>
      )}
      {projects.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}
      <ErrorHistoryModal open={showErrorModal} onClose={() => setShowErrorModal(false)} />
    </div>
  );
}
