import Docker from 'dockerode';

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
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: number;
}

/**
 * Lista todas as imagens Docker no sistema, formatadas.
 */
export async function listImages(): Promise<DockerImage[]> {
  const dockerInstance = getDockerInstance();
  const images = await dockerInstance.listImages();

  return images.map((img) => ({
    id: img.Id,
    name: img.RepoTags?.[0] || '<none>',
    size: img.Size,
    created: img.Created,
    tag: img.RepoTags?.[0]?.split(':')[1] || 'latest',
  }));
}

/**
 * Lista todos os containers Docker no sistema, formatados.
 */
export async function listContainers(): Promise<DockerContainer[]> {
  const dockerInstance = getDockerInstance();
  const containers = await dockerInstance.listContainers({ all: true });

  return containers.map((container) => ({
    id: container.Id,
    name: container.Names[0].replace(/^\//, ''),
    image: container.Image,
    status: container.Status,
    state: container.State,
    created: container.Created,
  }));
}
