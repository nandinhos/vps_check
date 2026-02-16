import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/infrastructure/docker/services/ProjectService';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';

const auditLogRepository = new PrismaAuditLogRepository();

export async function POST(req: NextRequest) {
  try {
    const { path, action } = await req.json();

    if (!path || !action) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    await ProjectService.executeAction(path, action);

    const auditAction = `COMPOSE_${action.toUpperCase()}` as any;

    await auditLogRepository.create({
      action: auditAction,
      resource: path,
      details: { action: `docker-compose-${action}`, path },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao executar ação no projeto', error);
    return NextResponse.json({ 
      error: error.message || 'Falha ao executar ação de orquestração' 
    }, { status: 500 });
  }
}
