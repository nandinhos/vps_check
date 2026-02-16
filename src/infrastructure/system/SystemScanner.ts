import { exec } from 'child_process';
import { promisify } from 'util';
import { DiskUsage } from '@/domain/entities/DiskScan';
import { logger } from '@/shared/logger';

const execPromise = promisify(exec);

const DEFAULT_PATHS_TO_SCAN = [
  '/var/log',
  '/var/log/journal',
  '/var/cache/apt',
  '/var/lib/apt/lists',
  '/tmp',
  '/var/lib/docker/volumes',
  '/var/lib/docker/overlay2',
  '/home/nandodev',
];

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) {
    return (mb / 1024).toFixed(2) + ' GB';
  }
  return mb.toFixed(2) + ' MB';
}

function parseDockerSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
  };
  
  return value * (units[unit] || 1);
}

export async function scanDiskUsage(paths = DEFAULT_PATHS_TO_SCAN): Promise<DiskUsage[]> {
  const results: DiskUsage[] = [];

  for (const path of paths) {
    const hostPath = `/hostfs${path}`;
    try {
      const result = await execPromise(`du -sb ${hostPath}`);
      
      if (result.stdout && result.stdout.trim().length > 0) {
        const parts = result.stdout.split(/\s+/);
        if (parts.length > 0) {
          const size = parseInt(parts[0]);
          if (!isNaN(size)) {
            results.push({
              id: `disk-${path}`,
              path,
              size,
              formattedSize: formatSize(size),
              scannedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      logger.debug(`Could not scan path: ${path}`, error);
    }
  }

  // Adiciona o Build Cache do Docker
  try {
    const buildCacheSize = await getDockerBuildCacheSize();
    results.push({
      id: 'docker-build-cache',
      path: 'Docker Build Cache',
      size: buildCacheSize,
      formattedSize: formatSize(buildCacheSize),
      scannedAt: new Date(),
    });
  } catch {
    // Falha silenciosa
  }

  return results.sort((a, b) => b.size - a.size);
}

export async function exploreDirectory(path: string): Promise<DiskUsage[]> {
  const hostPath = `/hostfs${path}`;
  
  return new Promise((resolve) => {
    exec(`find ${hostPath} -maxdepth 1 -not -path ${hostPath} -exec du -sb {} +`, (error, stdout) => {
      if (!stdout) return resolve([]);
      
      const lines = stdout.trim().split('\n');
      const results: DiskUsage[] = [];
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const size = parseInt(parts[0]);
          const fullPath = parts.slice(1).join(' ');
          const cleanPath = fullPath.replace('/hostfs', '');
          
          results.push({
            id: `explore-${cleanPath}`,
            path: cleanPath,
            size,
            formattedSize: formatSize(size),
            scannedAt: new Date(),
          });
        }
      }
      
      resolve(results.sort((a, b) => b.size - a.size).slice(0, 50));
    });
  });
}

async function getDockerBuildCacheSize(): Promise<number> {
  try {
    const { stdout } = await execPromise("docker system df --type build-cache --format '{{.Size}}'");
    const lines = String(stdout).trim().split('\n');
    let total = 0;
    for (const line of lines) {
      total += parseDockerSize(line.trim());
    }
    return total;
  } catch {
    return 0;
  }
}

export async function pruneDockerBuildCache(): Promise<void> {
  await execPromise('docker builder prune -f');
  logger.info('Docker build cache pruned');
}
