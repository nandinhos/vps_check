import { NextResponse } from 'next/server';
import { listVolumes } from '@/lib/docker';

export async function GET() {
  try {
    const volumes = await listVolumes();
    return NextResponse.json(volumes);
  } catch (error) {
    console.error('Erro ao listar volumes:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar volumes do Docker' },
      { status: 500 }
    );
  }
}
