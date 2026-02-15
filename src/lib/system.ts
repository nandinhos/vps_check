import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface DiskUsage {
  path: string;
  size: number;
  formattedSize: string;
}

/**
 * Escaneia pastas críticas do sistema para identificar ocupação de espaço.
 */
export async function scanDiskUsage(): Promise<DiskUsage[]> {
  const pathsToScan = [
    '/var/log',
    '/var/cache',
    '/tmp',
    '/var/lib/docker/volumes',
    '/var/lib/docker/overlay2',
    '/home/devuser',
  ];

  const results: DiskUsage[] = [];

  for (const path of pathsToScan) {
    try {
      // Usamos -s para summary e -b para bytes para facilitar o parsing
      const { stdout } = await execPromise(`du -sb ${path}`);
      const [sizeStr] = stdout.split('	');
      const size = parseInt(sizeStr);
      
      results.push({
        path,
        size,
        formattedSize: formatSize(size),
      });
    } catch (error) {
      console.error(`Erro ao escanear ${path}:`, error);
    }
  }

  return results;
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) {
    return (mb / 1024).toFixed(2) + ' GB';
  }
  return mb.toFixed(2) + ' MB';
}
