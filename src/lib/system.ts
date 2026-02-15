import { exec } from 'child_process';

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
      // Usamos exec para capturar stdout mesmo em caso de erro (ex: exit code 1 por permissão em subpastas)
      const result = await new Promise<{ stdout: string; stderr: string }>((resolve) => {
        exec(`du -sb ${path}`, (error, stdout, stderr) => {
          resolve({ 
            stdout: stdout ? String(stdout) : '', 
            stderr: stderr ? String(stderr) : '' 
          });
        });
      });

      if (result.stdout && result.stdout.trim().length > 0) {
        // O formato do du -b é "tamanho\tcaminho"
        const parts = result.stdout.split(/\s+/);
        if (parts.length > 0) {
          const size = parseInt(parts[0]);
          
          if (!isNaN(size)) {
            results.push({
              path,
              size,
              formattedSize: formatSize(size),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Erro inesperado ao escanear ${path}:`, error);
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
