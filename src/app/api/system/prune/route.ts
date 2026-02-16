import { NextResponse } from 'next/server';
import { pruneDockerBuildCache } from '@/infrastructure/system/SystemScanner';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

const auditLogRepository = new PrismaAuditLogRepository();

export async function POST() {
  try {
    await pruneDockerBuildCache();
    
    await auditLogRepository.create({
      action: 'PRUNE_BUILD_CACHE',
      resource: 'docker-build-cache',
      details: { action: 'prune-docker-build-cache' },
    });
    
    cacheManager.invalidate('diskScan');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao limpar build cache', error);
    return NextResponse.json(
      { error: message || 'Falha ao limpar build cache do Docker' },
      { status: 500 }
    );
  }
}
