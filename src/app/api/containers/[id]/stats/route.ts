import { NextRequest, NextResponse } from 'next/server';
import { DockerContainerRepository } from '@/infrastructure/docker';
import { logger } from '@/shared/logger';

const containerRepository = new DockerContainerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = await containerRepository.getStats(id);
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao buscar stats', error);
    return NextResponse.json(
      { error: message || 'Falha ao buscar estatísticas do container' },
      { status: 500 }
    );
  }
}
