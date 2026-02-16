import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database';
import { logger } from '@/shared/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const metrics = await prisma.containerMetric.findMany({
      where: { containerId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Inverte para ficar em ordem cronológica no gráfico
    const formattedMetrics = metrics.reverse().map(m => ({
      cpu: m.cpuUsage,
      memory: Number(m.memoryUsage),
      time: m.timestamp.toISOString(),
    }));

    return NextResponse.json(formattedMetrics);
  } catch (error) {
    logger.error('Erro ao buscar histórico de métricas', error);
    return NextResponse.json({ error: 'Falha ao carregar histórico' }, { status: 500 });
  }
}
