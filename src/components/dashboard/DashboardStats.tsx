'use client';

import { Container as ContainerIcon, HardDrive, Box, Database } from 'lucide-react';
import { useContainers, useImages, useVolumes, useDiskScan } from '@/lib/hooks/use-api';
import { formatSize } from '@/lib/utils';

export function DashboardStats() {
  const { data: containers } = useContainers();
  const { data: images } = useImages();
  const { data: volumes } = useVolumes();
  const { data: diskScan } = useDiskScan();

  const totalDiskUsage = diskScan?.reduce((acc, d) => acc + d.size, 0) || 0;
  const totalImagesSize = images?.reduce((acc, i) => acc + i.size, 0) || 0;
  const orphanVolumes = volumes?.filter(v => !v.inUse).length || 0;
  const orphanImages = images?.filter(i => i.isDangling || !i.inUse).length || 0;

  const stats = [
    { label: 'Containers', value: containers?.length || 0, icon: ContainerIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Imagens Docker', value: formatSize(totalImagesSize), icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Volumes', value: volumes?.length || 0, icon: Box, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Uso Disco', value: formatSize(totalDiskUsage), icon: Database, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  const warnings = [
    { label: 'Imagens órfãs', value: orphanImages, show: orphanImages > 0 },
    { label: 'Volumes órfãos', value: orphanVolumes, show: orphanVolumes > 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {warnings.filter(w => w.show).length > 0 && (
        <div className="flex gap-3">
          {warnings.filter(w => w.show).map((w) => (
            <div
              key={w.label}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-xs text-yellow-400">{w.label}: <span className="font-semibold">{w.value}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
