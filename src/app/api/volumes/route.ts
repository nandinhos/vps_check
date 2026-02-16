import { NextResponse } from 'next/server';
import { DockerVolumeRepository } from '@/infrastructure/docker';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';
import { config } from '@/config/app';

const volumeRepository = new DockerVolumeRepository();

export async function GET() {
  try {
    const cached = cacheManager.get<Awaited<ReturnType<typeof volumeRepository.findAll>>>('volumes');
    if (cached) {
      return NextResponse.json(cached);
    }

    const volumes = await volumeRepository.findAll();
    cacheManager.set('volumes', volumes, config.cache.ttl.volumes);
    return NextResponse.json(volumes);
  } catch (error) {
    logger.error('Erro ao listar volumes', error);
    return NextResponse.json(
      { error: 'Falha ao buscar volumes do Docker' },
      { status: 500 }
    );
  }
}
