import { NextRequest } from 'next/server';
import { getDockerClient } from '@/infrastructure/docker/DockerClient';
import { prisma } from '@/infrastructure/database';
import { NotificationService } from '@/infrastructure/notifications/NotificationService';
import { MetricCollector } from '@/infrastructure/system/MetricCollector';
import { logger } from '@/shared/logger';

export const dynamic = 'force-dynamic';

// Inicializa o coletor uma única vez
MetricCollector.start();

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const docker = getDockerClient();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Envia um evento inicial de conexão
        sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

        const dockerStream = await docker.getEvents({
          filters: { type: ['container', 'image', 'volume'] }
        });

        dockerStream.on('data', async (chunk) => {
          try {
            const event = JSON.parse(chunk.toString());
            sendEvent(event);
            
            // Lógica de Alertas
            if (event.Type === 'container' && (event.Action === 'die' || event.Action === 'oom')) {
              const exitCode = event.Actor.Attributes.exitCode;
              if (exitCode !== '0' || event.Action === 'oom') {
                const containerName = event.Actor.Attributes.name || event.id;
                await prisma.alert.create({
                  data: {
                    type: event.Action === 'oom' ? 'CONTAINER_OOM' : 'CONTAINER_DIE',
                    severity: 'CRITICAL',
                    message: `Container ${containerName} parou inesperadamente (Exit Code: ${exitCode})`,
                    resourceId: event.id,
                    metadata: JSON.stringify(event),
                  }
                }).catch(err => logger.error('Erro ao salvar alerta', err));

                await NotificationService.notify({
                  title: '🚨 Container Parou',
                  message: `O container ${containerName} parou inesperadamente.\nID: ${event.id.substring(0, 12)}\nExit Code: ${exitCode}`,
                  severity: 'CRITICAL'
                });
              }
            }
          } catch (e) {
            // Ignora chunks malformados
          }
        });

        dockerStream.on('error', (err) => {
          logger.error('Erro no stream de eventos do Docker', err);
          controller.close();
        });

        // Mantém a conexão viva com um heartbeat a cada 15s
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (e) {
            clearInterval(heartbeat);
          }
        }, 15000);

        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          if ('destroy' in dockerStream) {
            (dockerStream as any).destroy();
          }
          controller.close();
        });

      } catch (error) {
        logger.error('Falha ao iniciar stream SSE', error);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
