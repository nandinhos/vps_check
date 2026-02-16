import { NextRequest, NextResponse } from 'next/server';
import { getDockerClient } from '@/infrastructure/docker/DockerClient';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

export const maxDuration = 120;

const auditLogRepository = new PrismaAuditLogRepository();

export async function POST(request: NextRequest) {
  try {
    const { action, containerIds } = await request.json();
    
    if (!Array.isArray(containerIds) || containerIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum container especificado' }, { status: 400 });
    }

    const docker = getDockerClient();
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const containerId of containerIds) {
      try {
        const container = docker.getContainer(containerId);
        
        switch (action) {
          case 'start':
            await container.start();
            await auditLogRepository.create({
              action: 'START_CONTAINER',
              resource: containerId,
              details: { action: 'start-all', project: true },
            });
            break;

          case 'stop':
            await container.stop();
            await auditLogRepository.create({
              action: 'STOP_CONTAINER',
              resource: containerId,
              details: { action: 'stop-all', project: true },
            });
            break;

          case 'restart':
            await container.restart();
            await auditLogRepository.create({
              action: 'RESTART_CONTAINER',
              resource: containerId,
              details: { action: 'restart-all', project: true },
            });
            break;

          case 'pause':
            await container.pause();
            await auditLogRepository.create({
              action: 'PAUSE_CONTAINER',
              resource: containerId,
              details: { action: 'pause-all', project: true },
            });
            break;

          case 'unpause':
            await container.unpause();
            await auditLogRepository.create({
              action: 'UNPAUSE_CONTAINER',
              resource: containerId,
              details: { action: 'unpause-all', project: true },
            });
            break;

          default:
            return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
        }

        results.push({ id: containerId, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({ id: containerId, success: false, error: errorMessage });
        logger.error(`Erro ao executar ${action} no container ${containerId}`, error);
      }
    }

    cacheManager.invalidate('containers');
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({ 
      success: true,
      results,
      summary: `${successCount}成功(s), ${failCount} falhou(s)`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao gerenciar containers em massa', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
