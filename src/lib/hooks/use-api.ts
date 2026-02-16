import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Container, Image, Volume, DiskUsage } from '@/domain/entities';

const api = {
  async getContainers(): Promise<Container[]> {
    const res = await fetch('/api/containers');
    if (!res.ok) throw new Error('Failed to fetch containers');
    return res.json();
  },
  
  async getImages(): Promise<Image[]> {
    const res = await fetch('/api/images');
    if (!res.ok) throw new Error('Failed to fetch images');
    return res.json();
  },
  
  async getVolumes(): Promise<Volume[]> {
    const res = await fetch('/api/volumes');
    if (!res.ok) throw new Error('Failed to fetch volumes');
    return res.json();
  },
  
  async getDiskScan(): Promise<DiskUsage[]> {
    const res = await fetch('/api/system/scan');
    if (!res.ok) throw new Error('Failed to fetch disk scan');
    return res.json();
  },
  
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async deleteImage(id: string) {
    const res = await fetch(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete image');
    return res.json();
  },

  async deleteVolume(name: string) {
    const res = await fetch(`/api/volumes/${name}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete volume');
    return res.json();
  },

  async clearContainerLogs(id: string) {
    const res = await fetch('/api/containers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-logs', id }),
    });
    if (!res.ok) throw new Error('Failed to clear logs');
    return res.json();
  },

  async pruneBuildCache() {
    const res = await fetch('/api/system/prune', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to prune build cache');
    return res.json();
  },

  async manageContainer(id: string, action: 'start' | 'stop' | 'restart' | 'delete') {
    const res = await fetch(`/api/containers/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || `Failed to ${action} container`) as Error & {
        details?: string;
        suggestion?: string;
        stackTrace?: string;
      };
      error.details = data.details;
      error.suggestion = data.suggestion;
      error.stackTrace = data.stackTrace;
      throw error;
    }
    return data;
  },

  async manageContainers(containerIds: string[], action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause') {
    const res = await fetch('/api/containers/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, containerIds }),
    });
    if (!res.ok) throw new Error(`Failed to ${action} containers`);
    return res.json();
  },
};

export function useContainers() {
  return useQuery({
    queryKey: ['containers'],
    queryFn: api.getContainers,
    staleTime: 30000,
  });
}

export function useImages() {
  return useQuery({
    queryKey: ['images'],
    queryFn: api.getImages,
    staleTime: 60000,
  });
}

export function useVolumes() {
  return useQuery({
    queryKey: ['volumes'],
    queryFn: api.getVolumes,
    staleTime: 30000,
  });
}

export function useDiskScan() {
  return useQuery({
    queryKey: ['diskScan'],
    queryFn: api.getDiskScan,
    staleTime: 300000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteImage,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['images'] });
      }, 2000);
    },
  });
}

export function useDeleteVolume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteVolume,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['volumes'] });
      }, 2000);
    },
  });
}

export function useClearContainerLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.clearContainerLogs,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['containers'] });
      }, 2000);
    },
  });
}

export function usePruneBuildCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.pruneBuildCache,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['diskScan'] });
      }, 2000);
    },
  });
}

export function useManageContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' | 'delete' }) => 
      api.manageContainer(id, action),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['containers'] });
      }, 2000);
    },
  });
}

export function useManageContainers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ containerIds, action }: { containerIds: string[]; action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause' }) => 
      api.manageContainers(containerIds, action),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['containers'] });
      }, 2000);
    },
  });
}
