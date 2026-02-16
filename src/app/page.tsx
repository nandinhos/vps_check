'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Container as ContainerIcon, 
  Image as ImageIcon, 
  HardDrive, 
  RefreshCw,
  Activity,
  ChevronRight,
  Trash2,
  LogOut,
  Folder,
  Terminal as TerminalIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DiskUsageChart } from '@/components/dashboard/DiskUsageChart';
import { ContainersList } from '@/components/dashboard/ContainersList';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { ImagesList } from '@/components/dashboard/ImagesList';
import { VolumesList } from '@/components/dashboard/VolumesList';
import { ProjectsList } from '@/components/dashboard/ProjectsList';
import { TerminalDialog } from '@/components/dashboard/TerminalDialog';
import { 
  useDiskScan, 
  useHealth, 
  usePruneBuildCache, 
  useContainers, 
  useImages, 
  useVolumes,
  useDockerEvents,
  useProjects
} from '@/lib/hooks/use-api';
import { useToast } from '@/components/ui/toast';
import { cn, formatSize } from '@/lib/utils';

type TabType = 'overview' | 'containers' | 'images' | 'volumes' | 'projects';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [exploredData, setExploredData] = useState<{ path: string; size: number; formattedSize: string }[]>([]);
  const [exploring, setExploring] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showGlobalTerminal, setShowGlobalTerminal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTab = localStorage.getItem('activeTab') as TabType;
    if (savedTab && ['overview', 'containers', 'images', 'volumes', 'projects'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  const { data: diskScan, refetch: refetchDiskScan } = useDiskScan();
  const { data: health } = useHealth();
  const { data: containers } = useContainers();
  const { data: images } = useImages();
  const { data: volumes } = useVolumes();
  const { data: projects } = useProjects();
  const pruneCache = usePruneBuildCache();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({ title: 'Logout realizado', description: 'Você saiu do sistema.' });
      router.push('/login');
    } catch {
      toast({ title: 'Erro', description: 'Falha ao sair', variant: 'destructive' });
    }
  };

  useDockerEvents();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'projects' as const, label: 'Projetos', icon: Folder, count: projects?.length },
    { id: 'containers' as const, label: 'Containers', icon: ContainerIcon, count: containers?.length },
    { id: 'images' as const, label: 'Imagens', icon: ImageIcon, count: images?.length },
    { id: 'volumes' as const, label: 'Volumes', icon: HardDrive, count: volumes?.length },
  ];

  const handleExplore = async (path: string) => {
    if (expandedPath === path) {
      setExpandedPath(null);
      return;
    }
    
    setExploring(true);
    setExpandedPath(path);
    try {
      const res = await fetch(`/api/system/explore?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setExploredData(data);
    } catch {
      setExploring(false);
    } finally {
      setExploring(false);
    }
  };

  const handlePrune = async () => {
    try {
      await pruneCache.mutateAsync();
      toast({
        title: 'Build Cache limpo',
        description: 'O Docker Build Cache foi limpo com sucesso',
        variant: 'success',
      });
      refetchDiskScan();
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao limpar Build Cache',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  <span className="text-primary">VPS</span>
                  <span className="text-muted-foreground">Manager</span>
                </h1>
                <p className="text-xs text-muted-foreground">Gerenciamento de Recursos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowGlobalTerminal(true)}
                className="text-muted-foreground hover:text-primary"
                title="Terminal Global VPS"
              >
                <TerminalIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  health?.checks?.docker?.status === 'ok' ? "bg-green-500" : "bg-muted-foreground"
                )}></span>
                <span className="text-xs text-muted-foreground">
                  Docker {health?.checks?.docker?.status === 'ok' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-1 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                localStorage.setItem('activeTab', tab.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-foreground">Uso de Disco</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchDiskScan()}
                      disabled={diskScan === undefined}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {diskScan === undefined ? (
                      [...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))
                    ) : (
                      diskScan.map((item) => (
                        <div key={item.path} className="space-y-2">
                          <div 
                            className={cn(
                              'flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors',
                              expandedPath === item.path && 'bg-accent'
                            )}
                            onClick={() => item.path !== 'Docker Build Cache' && handleExplore(item.path)}
                          >
                            <div className="flex items-center gap-3">
                              {item.path !== 'Docker Build Cache' && (
                                <ChevronRight className={cn(
                                  'w-4 h-4 text-muted-foreground transition-transform',
                                  expandedPath === item.path && 'rotate-90'
                                )} />
                              )}
                              <span className="text-sm text-muted-foreground">{item.path}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-mono text-foreground">{item.formattedSize}</span>
                              {item.path === 'Docker Build Cache' && item.size > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handlePrune(); }}
                                  className="text-xs text-destructive hover:text-destructive h-6"
                                >
                                  Limpar
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {expandedPath === item.path && (
                            <div className="ml-6 p-3 bg-muted/50 rounded-lg space-y-2">
                              {exploring ? (
                                <Skeleton className="h-4 w-full" />
                              ) : exploredData.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Pasta vazia</p>
                              ) : (
                                exploredData.slice(0, 8).map((sub) => (
                                  <div key={sub.path} className="flex justify-between text-xs group">
                                    <span className="text-muted-foreground">{sub.path.split('/').pop()}</span>
                                    <span className="text-muted-foreground font-mono">{sub.formattedSize}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          <Progress 
                            value={Math.min((item.size / (50 * 1024 * 1024 * 1024)) * 100, 100)} 
                            className="h-1"
                            indicatorClassName={cn(
                              item.size > 1024 * 1024 * 1024 ? 'bg-destructive' : 'bg-primary'
                            )}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {diskScan && (
                <div className="lg:col-span-1">
                  <DiskUsageChart data={diskScan} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'containers' && <ContainersList />}
        {activeTab === 'projects' && <ProjectsList />}
        {activeTab === 'images' && <ImagesList />}
        {activeTab === 'volumes' && <VolumesList />}
      </div>

      <TerminalDialog
        containerId="host"
        containerName="VPS Host (Root)"
        open={showGlobalTerminal}
        onOpenChange={setShowGlobalTerminal}
      />
    </div>
  );
}
