import { NextResponse } from 'next/server';
import { DockerImageRepository } from '@/infrastructure/docker';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';
import { config } from '@/config/app';

const imageRepository = new DockerImageRepository();

export async function GET() {
  try {
    const cached = cacheManager.get<Awaited<ReturnType<typeof imageRepository.findAll>>>('images');
    if (cached) {
      return NextResponse.json(cached);
    }

    const images = await imageRepository.findAll();
    cacheManager.set('images', images, config.cache.ttl.images);
    return NextResponse.json(images);
  } catch (error) {
    logger.error('Erro ao listar imagens', error);
    return NextResponse.json(
      { error: 'Falha ao buscar imagens do Docker' },
      { status: 500 }
    );
  }
}
