import { NextRequest, NextResponse } from 'next/server';
import { clearContainerLogs, DockerContainerRepository } from '@/infrastructure/docker';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

const auditLogRepository = new PrismaAuditLogRepository();
const containerRepository = new DockerContainerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tail = parseInt(searchParams.get('tail') || '200');
    
    const logs = await containerRepository.getLogs(id, tail);
    
    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao buscar logs', error);
    return NextResponse.json(
      { error: message || 'Falha ao buscar logs do container' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await clearContainerLogs(id);
    await auditLogRepository.create({
      action: 'CLEAR_LOGS',
      resource: id,
      details: { action: 'clear-container-logs' },
    });
    cacheManager.invalidate('containers');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao limpar logs', error);
    return NextResponse.json(
      { error: message || 'Falha ao limpar logs do container' },
      { status: 500 }
    );
  }
}
