import { NextResponse } from 'next/server';
import { checkDockerConnection } from '@/infrastructure/docker/DockerClient';
import { prisma } from '@/infrastructure/database';
import { cacheManager } from '@/shared/cache';
import { backgroundSync } from '@/shared/sync';
import { config } from '@/config/app';

export async function GET() {
  const checks: Record<string, unknown> = {};
  let overallStatus = 'healthy';

  const startDb = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - startDb };
  } catch (error) {
    checks.database = { status: 'error', error: String(error) };
    overallStatus = 'degraded';
  }

  const startDocker = Date.now();
  try {
    const dockerOk = await checkDockerConnection();
    checks.docker = { 
      status: dockerOk ? 'ok' : 'error', 
      latency: Date.now() - startDocker 
    };
    if (!dockerOk) overallStatus = 'degraded';
  } catch (error) {
    checks.docker = { status: 'error', error: String(error) };
    overallStatus = 'unhealthy';
  }

  checks.cache = cacheManager.getStats();
  checks.sync = backgroundSync.getStatus();
  checks.config = {
    env: config.nodeEnv,
    features: config.features,
  };

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  });
}
