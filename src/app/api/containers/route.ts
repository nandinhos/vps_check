import { NextResponse } from 'next/server';
import { listContainers } from '@/lib/docker';

export async function GET() {
  try {
    const containers = await listContainers();
    return NextResponse.json(containers);
  } catch (error) {
    console.error('Erro ao listar containers:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar containers do Docker' },
      { status: 500 }
    );
  }
}
