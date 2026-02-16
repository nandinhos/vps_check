import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/infrastructure/docker/services/ProjectService';
import { logger } from '@/shared/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const tail = parseInt(searchParams.get('tail') || '200');

    if (!path) {
      return NextResponse.json({ error: 'Caminho do projeto não fornecido' }, { status: 400 });
    }

    const logs = await ProjectService.getProjectLogs(path, tail);
    
    return NextResponse.json({ logs }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Erro na API de logs de projeto', error);
    return NextResponse.json({ error: 'Falha ao carregar logs' }, { status: 500 });
  }
}
