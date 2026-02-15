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
    '/home/nandodev',
  ];

  const results: DiskUsage[] = [];

  for (const path of pathsToScan) {
    const hostPath = `/hostfs${path}`;
    try {
      const result = await new Promise<{ stdout: string }>((resolve) => {
        exec(`du -sb ${hostPath}`, (error, stdout) => {
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
 * Explora um diretório específico para listar subdiretórios e arquivos.
 */
export async function exploreDirectory(path: string): Promise<DiskUsage[]> {
  const hostPath = `/hostfs${path}`;
  
  return new Promise((resolve) => {
    // Lista todos os itens (incluindo ocultos) e seus tamanhos (profundidade 1)
    // find captura tudo e o du calcula o tamanho
    exec(`find ${hostPath} -maxdepth 1 -not -path ${hostPath} -exec du -sb {} +`, (error, stdout) => {
      if (!stdout) return resolve([]);
      
      const lines = stdout.trim().split('\n');
      const results: DiskUsage[] = [];
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const size = parseInt(parts[0]);
          const fullPath = parts.slice(1).join(' ');
          const cleanPath = fullPath.replace('/hostfs', ''); // Volta para o path original
          
          results.push({
            path: cleanPath,
            size,
            formattedSize: formatSize(size),
          });
        }
      }
      
      // Ordena por tamanho decrescente
      resolve(results.sort((a, b) => b.size - a.size).slice(0, 50)); // Limita aos 50 maiores
    });
  });
}

/**
 * Obtém o tamanho total do Build Cache do Docker.
 */
async function getDockerBuildCacheSize(): Promise<number> {
  return new Promise((resolve) => {
    exec("docker system df --type build-cache --format '{{.Size}}'", (error, stdout) => {
      if (error) return resolve(0);
      const lines = String(stdout).trim().split('\n');
      let total = 0;
      for (const line of lines) {
        total += parseDockerSize(line.trim());
      }
      resolve(total);
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
