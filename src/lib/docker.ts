import Docker from 'dockerode';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let docker: Docker | null = null;

/**
 * Retorna uma instância singleton do Dockerode.
 * Por padrão, conecta-se ao socket do Docker em /var/run/docker.sock
 */
export function getDockerInstance(): Docker {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

export interface DockerImage {
  id: string;
  name: string;
  size: number;
  created: number;
  tag: string;
  isDangling: boolean;
  inUse: boolean;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  imageId: string;
  status: string;
  state: string;
  created: number;
  logSize: number;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  inUse: boolean;
  size?: number; // Tamanho em bytes, se disponível
}

/**
 * Lista todas as imagens Docker no sistema, formatadas.
 */
export async function listImages(): Promise<DockerImage[]> {
  const dockerInstance = getDockerInstance();
  const [images, containers] = await Promise.all([
    dockerInstance.listImages({ all: true }),
    dockerInstance.listContainers({ all: true }),
  ]);

  const usedImageIds = new Set(containers.map((c) => c.ImageID));

  return images.map((img) => ({
    id: img.Id,
    name: img.RepoTags?.[0] || '<none>',
    size: img.Size,
    created: img.Created,
    tag: img.RepoTags?.[0]?.split(':')[1] || '<none>',
    isDangling: img.RepoTags === null || img.RepoTags?.[0] === '<none>:<none>',
    inUse: usedImageIds.has(img.Id),
  }));
}

/**
 * Lista todos os containers Docker no sistema, formatados.
 */
export async function listContainers(): Promise<DockerContainer[]> {
  const dockerInstance = getDockerInstance();
  const containers = await dockerInstance.listContainers({ all: true });

  const containersWithLogs = await Promise.all(
    containers.map(async (container) => {
      let logSize = 0;
      try {
        const data = await dockerInstance.getContainer(container.Id).inspect();
        const logPath = data.LogPath;
        if (logPath) {
          // Usamos sudo du para contornar restrições de permissão em /var/lib/docker
          const result = await new Promise<{ stdout: string }>((resolve, reject) => {
            exec(`sudo du -b ${logPath}`, (error, stdout) => {
              if (error) return reject(error);
              resolve({ stdout: String(stdout) });
            });
          });
          
          const [sizeStr] = result.stdout.split(/\s+/);
          logSize = parseInt(sizeStr) || 0;
        }
      } catch (e) {
        // Silenciosamente falha se não conseguir ler o log
      }

      return {
        id: container.Id,
        name: container.Names[0].replace(/^\//, ''),
        image: container.Image,
        imageId: container.ImageID,
        status: container.Status,
        state: container.State,
        created: container.Created,
        logSize,
      };
    })
  );

  return containersWithLogs;
}

/**
 * Remove uma imagem do Docker.
 */
export async function removeImage(id: string): Promise<void> {
  const dockerInstance = getDockerInstance();
  const image = dockerInstance.getImage(id);
  await image.remove();
}

/**
 * Lista todos os volumes Docker no sistema, formatados.
 */
export async function listVolumes(): Promise<DockerVolume[]> {
  const dockerInstance = getDockerInstance();
  const [volumesData, containers] = await Promise.all([
    dockerInstance.listVolumes(),
    dockerInstance.listContainers({ all: true }),
  ]);

  const usedVolumes = new Set();
  containers.forEach((container) => {
    container.Mounts.forEach((mount) => {
      if (mount.Name) {
        usedVolumes.add(mount.Name);
      }
    });
  });

  return (volumesData.Volumes || []).map((v) => ({
    name: v.Name,
    driver: v.Driver,
    mountpoint: v.Mountpoint,
    inUse: usedVolumes.has(v.Name),
  }));
}

/**
 * Remove um volume do Docker.
 */
export async function removeVolume(name: string): Promise<void> {
  const dockerInstance = getDockerInstance();
  const volume = dockerInstance.getVolume(name);
  await volume.remove();
}

/**
 * Limpa (trunca) os logs de um container.
 */
export async function clearContainerLogs(id: string): Promise<void> {
  const dockerInstance = getDockerInstance();
  const data = await dockerInstance.getContainer(id).inspect();
  const logPath = data.LogPath;
  
  if (logPath) {
    // Usamos sudo truncate para contornar permissões
    await new Promise((resolve, reject) => {
      exec(`sudo truncate -s 0 ${logPath}`, (error) => {
        if (error) return reject(error);
        resolve(true);
      });
    });
  } else {
    throw new Error('Caminho do log não encontrado ou inacessível');
  }
}
