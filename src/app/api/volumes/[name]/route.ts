import { NextRequest, NextResponse } from 'next/server';
import { DockerVolumeRepository } from '@/infrastructure/docker';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

const volumeRepository = new DockerVolumeRepository();
const auditLogRepository = new PrismaAuditLogRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    await volumeRepository.delete(name);
    
    await auditLogRepository.create({
      action: 'DELETE_VOLUME',
      resource: name,
      details: { name },
    });
    
    cacheManager.invalidate('volumes');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao remover volume', error);
    return NextResponse.json(
      { error: message || 'Falha ao remover volume do Docker' },
      { status: 500 }
    );
  }
}
