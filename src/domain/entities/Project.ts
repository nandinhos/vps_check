export interface Project {
  id: string;          // Nome do diretório ou nome do projeto compose
  name: string;
  path: string;        // Caminho absoluto para o docker-compose.yml
  config?: string;     // Conteúdo do arquivo YAML
  status: 'running' | 'stopped' | 'partial' | 'unknown';
  containerCount: number;
  runningCount: number;
  lastActionAt?: Date;
}

export interface ProjectActionInput {
  projectId: string;
  action: 'up' | 'down' | 'restart' | 'pull';
}
