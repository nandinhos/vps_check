import { NextResponse } from 'next/server';
import { scanDiskUsage } from '@/infrastructure/system/SystemScanner';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';
import { config } from '@/config/app';

export async function GET() {
  try {
    const cached = cacheManager.get<Awaited<ReturnType<typeof scanDiskUsage>>>('diskScan');
    if (cached) {
      return NextResponse.json(cached);
    }

    const usage = await scanDiskUsage();
    cacheManager.set('diskScan', usage, config.cache.ttl.diskScan);
    return NextResponse.json(usage);
  } catch (error) {
    logger.error('Erro ao realizar varredura de disco', error);
    return NextResponse.json(
      { error: 'Falha ao realizar varredura de disco' },
      { status: 500 }
    );
  }
}
