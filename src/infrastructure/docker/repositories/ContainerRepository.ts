import { exec } from 'child_process';
import { promisify } from 'util';
import { getDockerClient } from '../DockerClient';
import { IContainerRepository } from '@/domain/repositories/IContainerRepository';
import { Container, ContainerCreateInput, ContainerUpdateInput, PortMapping } from '@/domain/entities/Container';
import { logger } from '@/shared/logger';

const execPromise = promisify(exec);

export class DockerContainerRepository implements IContainerRepository {
  private extractPorts(container: any): PortMapping[] {
    const ports: PortMapping[] = [];
    const seen = new Set<string>();
    
    if (container.Ports) {
      container.Ports.forEach((port: any) => {
        const key = `${port.PublicPort || ''}-${port.PrivatePort}-${port.Type}`;
        if (seen.has(key)) return;
        seen.add(key);
        
        if (port.PublicPort) {
          ports.push({
            hostPort: port.PublicPort,
            containerPort: port.PrivatePort,
            protocol: port.Type as 'tcp' | 'udp',
            isExposed: true
          });
        } else if (port.PrivatePort) {
          ports.push({
            hostPort: port.PrivatePort,
            containerPort: port.PrivatePort,
            protocol: port.Type as 'tcp' | 'udp',
            isExposed: false
          });
        }
      });
    }
    
    return ports;
  }

  private formatContainer(container: Container): Container {
    return {
      ...container,
      logSize: Number(container.logSize),
    };
  }

  async findAll(): Promise<Container[]> {
    const docker = getDockerClient();
    const containers = await docker.listContainers({ all: true });

    const containersWithLogs = await Promise.all(
      containers.map(async (c) => {
        let logSize = 0;
        try {
          const data = await docker.getContainer(c.Id).inspect();
          const logPath = data.LogPath;
          if (logPath) {
            const result = await execPromise(`sudo du -b ${logPath}`);
            const [sizeStr] = result.stdout.split(/\s+/);
            logSize = parseInt(sizeStr) || 0;
          }
        } catch {
          // Silenciosamente falha se não conseguir ler o log
        }

        return {
          id: c.Id,
          name: c.Names[0].replace(/^\//, ''),
          image: c.Image,
          imageId: c.ImageID,
          status: c.Status,
          state: c.State,
          created: c.Created,
          logSize,
          ports: this.extractPorts(c),
        };
      })
    );

    return containersWithLogs.map(c => this.formatContainer(c));
  }

  async findById(id: string): Promise<Container | null> {
    const docker = getDockerClient();
    try {
      const container = await docker.getContainer(id).inspect();
      return {
        id: container.Id,
        name: container.Name.replace(/^\//, ''),
        image: container.Config.Image,
        imageId: container.Image,
        status: container.State.Status,
        state: container.State.Status,
        created: typeof container.Created === 'number' ? container.Created : Date.parse(container.Created as string),
        logSize: 0,
        ports: this.extractPorts(container),
      };
    } catch {
      return null;
    }
  }

  async create(input: ContainerCreateInput): Promise<Container> {
    return this.formatContainer(input);
  }

  async update(id: string, input: ContainerUpdateInput): Promise<Container> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Container não encontrado');
    }
    return this.formatContainer({ ...existing, ...input });
  }

  async upsert(input: ContainerCreateInput): Promise<Container> {
    return this.formatContainer(input);
  }

  async delete(id: string): Promise<void> {
    const docker = getDockerClient();
    const container = docker.getContainer(id);
    await container.remove({ force: true });
  }

  async getLogs(id: string, tail: number = 200): Promise<string> {
    const docker = getDockerClient();
    const container = docker.getContainer(id);
    
    try {
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        follow: false,
      });

      // O Docker retorna os logs multiplexados (com headers de 8 bytes). 
      // O dockerode não desmultiplexa automaticamente no método .logs() quando retorna Buffer.
      // Vamos converter para string e limpar caracteres de controle se necessário.
      // Uma forma simples de ler é tratar como string e remover os headers de 8 bytes que aparecem.
      
      const logString = logs.toString('utf8');
      
      // Regex para remover os headers do protocolo de stream do Docker (8 bytes iniciais de cada chunk)
      // O header é [type, 0, 0, 0, size_3, size_2, size_1, size_0]
      // Aqui vamos apenas limpar caracteres não imprimíveis no início das linhas para simplificar.
      const cleanedLogs = logString.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      
      return cleanedLogs;
    } catch (error) {
      logger.error('Erro ao buscar logs do container via SDK', { id, error });
      return 'Não foi possível recuperar os logs do container via SDK.';
    }
  }
}

export async function clearContainerLogs(id: string): Promise<void> {
  const docker = getDockerClient();
  const data = await docker.getContainer(id).inspect();
  const logPath = data.LogPath;
  
  if (logPath) {
    await execPromise(`sudo truncate -s 0 ${logPath}`);
    logger.info('Container logs cleared', { containerId: id });
  } else {
    throw new Error('Caminho do log não encontrado ou inacessível');
  }
}
