import { DockerContainerRepository } from '@/infrastructure/docker';
import { prisma } from '@/infrastructure/database';
import { logger } from '@/shared/logger';
import { TerminalServer } from '../terminal/TerminalServer';

export class MetricCollector {
  private static interval: NodeJS.Timeout | null = null;
  private static terminalServer: TerminalServer | null = null;
  private static containerRepository = new DockerContainerRepository();

  static start(intervalMs: number = 60000) { // Padrão: 1 minuto
    if (this.interval) return;

    logger.info('Iniciando coletor de métricas em background...');
    
    // Inicia o servidor de terminal na porta 3001
    try {
      this.terminalServer = new TerminalServer(3001);
    } catch (err) {
      logger.error('Falha ao iniciar Terminal Server', err);
    }

    this.interval = setInterval(async () => {
      try {
        const containers = await this.containerRepository.findAll();
        const runningContainers = containers.filter(c => c.state === 'running');

        for (const container of runningContainers) {
          try {
            const stats = await this.containerRepository.getStats(container.id);
            
            await prisma.containerMetric.create({
              data: {
                containerId: container.id,
                cpuUsage: stats.cpuUsage,
                memoryUsage: BigInt(stats.memoryUsage),
              }
            });
          } catch (err) {
            // Ignora erro individual de container
          }
        }

        // Limpeza opcional: remover métricas com mais de 24h para não lotar o DB
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await prisma.containerMetric.deleteMany({
          where: { timestamp: { lt: yesterday } }
        });

      } catch (error) {
        logger.error('Erro no coletor de métricas', error);
      }
    }, intervalMs);
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
