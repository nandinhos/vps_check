import { NextRequest, NextResponse } from 'next/server';
import { DockerImageRepository } from '@/infrastructure/docker';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

export const maxDuration = 60;

const imageRepository = new DockerImageRepository();
const auditLogRepository = new PrismaAuditLogRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await imageRepository.delete(id);
    
    try {
      await auditLogRepository.create({
        action: 'DELETE_IMAGE',
        resource: id,
        details: { id },
      });
    } catch (auditError) {
      logger.warn('Falha ao criar audit log para delete de imagem', auditError);
    }
    
    cacheManager.invalidate('images');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao remover imagem', error);
    return NextResponse.json(
      { error: message || 'Falha ao remover imagem do Docker' },
      { status: 500 }
    );
  }
}
