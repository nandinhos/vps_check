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
