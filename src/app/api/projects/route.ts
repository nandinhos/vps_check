import { NextResponse } from 'next/server';
import { ProjectService } from '@/infrastructure/docker/services/ProjectService';
import { logger } from '@/shared/logger';

export async function GET() {
  try {
    const projects = await ProjectService.findProjects();
    return NextResponse.json(projects, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    logger.error('Erro na API de projetos', error);
    return NextResponse.json({ error: 'Falha ao carregar projetos' }, { status: 500 });
  }
}
