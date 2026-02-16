import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
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

      if (!token || !containerId) {
        ws.close(1008, 'Token ou ContainerId ausente');
        return;
      }

      const payload = await verifyToken(token === 'session' ? req.headers.cookie?.split('auth_token=')[1]?.split(';')[0] : token);
      if (!payload || payload.role !== 'ADMIN') {
        ws.close(1008, 'Não autorizado');
        return;
      }

      try {
        if (containerId === 'host') {
          // Terminal Direto no Container do Gerenciador (Acesso à VPS via /hostfs)
          const shell = spawn('/bin/sh', ['-i'], {
            env: { ...process.env, TERM: 'xterm-256color' },
            cols: 80,
            rows: 24,
          } as any);

          await prisma.auditLog.create({
            data: {
              action: 'TERMINAL_OPEN' as any,
              resource: 'HOST_VPS',
              userId: payload.id as string,
              details: JSON.stringify({ username: payload.username, type: 'host-system' })
            }
          });

          shell.stdout.on('data', (data) => ws.send(data.toString()));
          shell.stderr.on('data', (data) => ws.send(data.toString()));
          ws.on('message', (msg) => shell.stdin.write(msg.toString()));

          ws.on('close', () => shell.kill());
          shell.on('exit', () => ws.close());
        } else {
          // Terminal via Docker Exec (Containers individuais)
          const docker = getDockerClient();
          const container = docker.getContainer(containerId);

          await prisma.auditLog.create({
            data: {
              action: 'TERMINAL_OPEN' as any,
              resource: containerId,
              userId: payload.id as string,
              details: JSON.stringify({ username: payload.username })
            }
          });

          const exec = await container.exec({
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/sh'],
          });

          const stream = await exec.start({ hijack: true, stdin: true });

          stream.on('data', (chunk) => ws.send(chunk.toString()));
          ws.on('message', (data) => stream.write(data.toString()));
          ws.on('close', () => stream.end());
          stream.on('end', () => ws.close());
        }
      } catch (err) {
        logger.error('Erro no Terminal Server', err);
        ws.close(1011, 'Erro interno');
      }
    });
  }
}
