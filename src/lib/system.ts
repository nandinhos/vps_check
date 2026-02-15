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
    '/var/log/journal',
    '/var/cache/apt',
    '/var/lib/apt/lists',
    '/tmp',
    '/var/lib/docker/volumes',
    '/var/lib/docker/overlay2',
    '/home/devuser',
    '/home/devuser/.cache',
  ];

  const results: DiskUsage[] = [];

  for (const path of pathsToScan) {
    try {
      const result = await new Promise<{ stdout: string }>((resolve) => {
        exec(`sudo du -sb ${path}`, (error, stdout) => {
          resolve({ stdout: stdout ? String(stdout) : '' });
        });
      });

      if (result.stdout && result.stdout.trim().length > 0) {
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

  // Adiciona o Build Cache do Docker (comando específico)
  try {
    const buildCacheSize = await getDockerBuildCacheSize();
    results.push({
      path: 'Docker Build Cache',
      size: buildCacheSize,
      formattedSize: formatSize(buildCacheSize),
    });
  } catch (e) {
    // Falha silenciosa se não conseguir ler o cache
  }

  return results.sort((a, b) => b.size - a.size);
}

/**
 * Obtém o tamanho total do Build Cache do Docker.
 */
async function getDockerBuildCacheSize(): Promise<number> {
  return new Promise((resolve) => {
    // docker system df --format "{{.Size}}" --type build-cache pode retornar algo como "1.2GB"
    // Usamos uma abordagem via shell para somar se necessário ou pegar o total
    exec("docker system df --format '{{.Size}}' | head -n 1", (error, stdout) => {
      if (error) return resolve(0);
      const sizeStr = String(stdout).trim();
      resolve(parseDockerSize(sizeStr));
    });
  });
}

function parseDockerSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
  };
  
  return value * (units[unit] || 1);
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) {
    return (mb / 1024).toFixed(2) + ' GB';
  }
  return mb.toFixed(2) + ' MB';
}
