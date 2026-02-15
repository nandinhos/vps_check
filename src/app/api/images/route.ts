import { NextResponse } from 'next/server';
import { listImages } from '@/lib/docker';

export async function GET() {
  try {
    const images = await listImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar imagens do Docker' },
      { status: 500 }
    );
  }
}
