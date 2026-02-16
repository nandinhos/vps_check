import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { getDockerClient } from '../DockerClient';
import { Project } from '@/domain/entities/Project';
import { logger } from '@/shared/logger';

const execPromise = promisify(exec);

export class ProjectService {
  private static BASE_SEARCH_PATH = '/hostfs/home/nandodev/projects';

  static async findProjects(): Promise<Project[]> {
    const projects: Project[] = [];
    
    try {
      // 1. Localiza arquivos docker-compose.yml ou docker-compose.yaml
      const { stdout } = await execPromise(`find ${this.BASE_SEARCH_PATH} -maxdepth 3 -name "docker-compose.y*ml"`);
      const filePaths = stdout.trim().split('\n').filter(p => p.length > 0);

      // 2. Busca todos os containers para mapear status
      const docker = getDockerClient();
      const containers = await docker.listContainers({ all: true });

      for (const filePath of filePaths) {
        const projectDir = path.dirname(filePath);
        const projectName = path.basename(projectDir);
        const relativePath = filePath.replace('/hostfs', '');

        // Filtra containers que pertencem a este projeto (pelo working_dir ou labels)
        const projectContainers = containers.filter(c => {
          const workingDir = c.Labels?.['com.docker.compose.project.working_dir'];
          return workingDir === projectDir || workingDir === relativePath;
        });

        const runningCount = projectContainers.filter(c => c.State === 'running').length;
        const totalCount = projectContainers.length;

        let status: Project['status'] = 'unknown';
        if (totalCount > 0) {
          if (runningCount === totalCount) status = 'running';
          else if (runningCount === 0) status = 'stopped';
          else status = 'partial';
        }

        projects.push({
          id: projectName,
          name: projectName,
          path: relativePath,
          status,
          containerCount: totalCount,
          runningCount,
        });
      }
    } catch (error) {
      logger.error('Erro ao buscar projetos Compose', error);
    }

    return projects;
  }

  static async executeAction(projectPath: string, action: 'up' | 'down' | 'restart' | 'pull'): Promise<void> {
    const hostPath = `/hostfs${projectPath}`;
    const projectDir = path.dirname(hostPath);
    
    let command = '';
    switch (action) {
      case 'up': command = 'docker compose up -d'; break;
      case 'down': command = 'docker compose down'; break;
      case 'restart': command = 'docker compose restart'; break;
      case 'pull': command = 'docker compose pull'; break;
    }

    logger.info(`Executando ação ${action} no projeto: ${projectDir}`);
    
    // Executamos o comando dentro do diretório do projeto
    try {
      await execPromise(`cd ${projectDir} && ${command}`);
    } catch (error) {
      logger.error(`Falha ao executar ${action} no projeto ${projectDir}`, error);
      throw error;
    }
  }

  static async getProjectConfig(projectPath: string): Promise<string> {
    const hostPath = `/hostfs${projectPath}`;
    try {
      return await fs.readFile(hostPath, 'utf-8');
    } catch (error) {
      logger.error(`Erro ao ler arquivo config: ${hostPath}`, error);
      throw new Error('Não foi possível ler o arquivo de configuração.');
    }
  }
}
