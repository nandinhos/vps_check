'use client';

import { useState } from 'react';
import { useProjects, useManageProject } from '@/lib/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { 
  Folder, 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  ExternalLink,
  Loader2,
  FileCode,
  FileText
} from 'lucide-react';
import { ProjectLogViewerDialog } from './ProjectLogViewerDialog';
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

function ProjectSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ProjectsList() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const manageProject = useManageProject();
  const { toast } = useToast();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [showLogsPath, setShowLogsPath] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ path: string, name: string, action: 'down' | 'restart' } | null>(null);

  if (isLoading) return <ProjectSkeleton />;
  if (error) return <p className="text-destructive text-center py-8">Erro ao carregar projetos Compose.</p>;

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="Nenhum projeto encontrado"
        description="Não localizamos arquivos docker-compose.yml em /home/nandodev/projects."
      />
    );
  }

  const handleAction = async (path: string, action: 'up' | 'down' | 'restart' | 'pull') => {
    if (action === 'down' || action === 'restart') {
      const project = projects.find(p => p.path === path);
      setConfirmAction({ path, name: project?.name || 'Projeto', action });
      return;
    }
    executeAction(path, action);
  };

  const executeAction = async (path: string, action: 'up' | 'down' | 'restart' | 'pull') => {
    setLoadingPath(`${path}-${action}`);
    try {
      await manageProject.mutateAsync({ path, action });
      toast({
        title: `Sucesso: ${action.toUpperCase()}`,
        description: `Operação concluída no projeto.`,
        variant: 'success'
      });
      refetch();
    } catch (err: any) {
      toast({
        title: "Erro de Orquestração",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingPath(null);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileCode className="w-5 h-5 text-primary" />
          Orquestração Docker Compose
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Card key={project.path} className="overflow-hidden border-border/50 bg-card/50 hover:border-primary/30 transition-all group">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold capitalize">{project.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]" title={project.path}>
                      {project.path}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  project.status === 'running' ? 'success' : 
                  project.status === 'stopped' ? 'destructive' : 
                  project.status === 'partial' ? 'warning' : 'secondary'
                }>
                  {project.status === 'running' ? 'Rodando' : 
                   project.status === 'stopped' ? 'Parado' : 
                   project.status === 'partial' ? 'Parcial' : 'Desconhecido'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{project.containerCount}</span> containers mapeados
                  {project.runningCount > 0 && (
                    <span className="ml-1 text-green-500">({project.runningCount} ativos)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="h-8 flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={() => handleAction(project.path, 'up')}
                  disabled={loadingPath !== null || project.status === 'running'}
                >
                  {loadingPath === `${project.path}-up` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                  Up
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 flex-1" 
                  onClick={() => handleAction(project.path, 'restart')}
                  disabled={loadingPath !== null}
                >
                  {loadingPath === `${project.path}-restart` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  Restart
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 flex-1" 
                  onClick={() => handleAction(project.path, 'pull')}
                  disabled={loadingPath !== null}
                >
                  {loadingPath === `${project.path}-pull` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                  Pull
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 flex-1" 
                  onClick={() => setShowLogsPath(project.path)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Logs
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-8 w-10 flex-none" 
                  onClick={() => handleAction(project.path, 'down')}
                  disabled={loadingPath !== null || project.status === 'stopped'}
                >
                  {loadingPath === `${project.path}-down` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja executar <strong>{confirmAction?.action === 'down' ? 'Docker Compose Down' : 'Docker Compose Restart'}</strong> no projeto <strong>{confirmAction?.name}</strong>?
              {confirmAction?.action === 'down' && " Isso removerá todos os containers e redes do projeto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && executeAction(confirmAction.path, confirmAction.action)}
              className={confirmAction?.action === 'down' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showLogsPath && (
        <ProjectLogViewerDialog
          projectPath={showLogsPath}
          projectName={projects.find(p => p.path === showLogsPath)?.name || ''}
          open={!!showLogsPath}
          onOpenChange={(open) => !open && setShowLogsPath(null)}
        />
      )}
    </div>
  );
}
