import Docker from 'dockerode';
import { config } from '@/config/app';
import { logger } from '@/shared/logger';

let docker: Docker | null = null;

export function getDockerClient(): Docker {
  if (!docker) {
    docker = new Docker({
      socketPath: config.docker.socket,
    });
    logger.debug('Docker client initialized', { socket: config.docker.socket });
  }
  return docker;
}

export async function checkDockerConnection(): Promise<boolean> {
  try {
    const dockerClient = getDockerClient();
    await dockerClient.ping();
    logger.info('Docker connection verified');
    return true;
  } catch (error) {
    logger.error('Docker connection failed', error);
    return false;
  }
}
