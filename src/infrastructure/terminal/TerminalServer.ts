import { WebSocketServer, WebSocket } from 'ws';
import { getDockerClient } from '../docker/DockerClient';
import { verifyToken } from '@/shared/auth';
import { logger } from '@/shared/logger';
import { prisma } from '../database';

export class TerminalServer {
  private wss: WebSocketServer;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.init();
    logger.info(`Terminal WebSocket Server rodando na porta ${port}`);
  }

  private init() {
    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const containerId = url.searchParams.get('containerId');

      // 1. Validação de Segurança
      if (!token || !containerId) {
        ws.close(1008, 'Token ou ContainerId ausente');
        return;
      }

      const payload = await verifyToken(token);
      if (!payload || payload.role !== 'ADMIN') {
        ws.close(1008, 'Não autorizado: Apenas Super Admin');
        return;
      }

      try {
        const docker = getDockerClient();
        const container = docker.getContainer(containerId);

        // 2. Registro de Auditoria
        await prisma.auditLog.create({
          data: {
            action: 'TERMINAL_OPEN' as any,
            resource: containerId,
            userId: payload.id as string,
            details: JSON.stringify({ username: payload.username })
          }
        });

        // 3. Iniciar Execução no Docker
        const exec = await container.exec({
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          Cmd: ['/bin/sh'], // Usamos sh por ser universal em imagens linux
        });

        const stream = await exec.start({
          hijack: true,
          stdin: true,
        });

        // 4. Ponte de Dados: Browser <-> Docker
        // Do Docker para o Browser
        stream.on('data', (chunk) => {
          ws.send(chunk.toString());
        });

        // Do Browser para o Docker
        ws.on('message', (data) => {
          stream.write(data.toString());
        });

        ws.on('close', () => {
          stream.end();
          logger.info(`Terminal fechado para container: ${containerId}`);
        });

        stream.on('end', () => {
          ws.close();
        });

      } catch (err) {
        logger.error('Erro ao iniciar terminal docker', err);
        ws.close(1011, 'Erro ao conectar ao container');
      }
    });

    logger.info('Terminal WebSocket Server inicializado na rota /api/terminal');
  }
}
