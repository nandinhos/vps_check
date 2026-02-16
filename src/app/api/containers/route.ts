import { NextResponse } from 'next/server';
import { DockerContainerRepository, clearContainerLogs } from '@/infrastructure/docker';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';
import { config } from '@/config/app';

export const maxDuration = 60;

const containerRepository = new DockerContainerRepository();
const auditLogRepository = new PrismaAuditLogRepository();

export async function GET() {
  try {
    const containers = await containerRepository.findAll();
    return NextResponse.json(containers, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    logger.error('Erro ao listar containers', error);
    return NextResponse.json(
      { error: 'Falha ao buscar containers do Docker' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, id } = await request.json();

    if (action === 'clear-logs') {
      await clearContainerLogs(id);
      await auditLogRepository.create({
        action: 'CLEAR_LOGS',
        resource: id,
        details: { action: 'clear-container-logs' },
      });
      cacheManager.invalidate('containers');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao executar ação no container', error);
    return NextResponse.json(
      { error: message || 'Falha ao executar ação' },
      { status: 500 }
    );
  }
}
