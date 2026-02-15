import { NextRequest, NextResponse } from 'next/server';
import { removeImage } from '@/lib/docker';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await removeImage(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover imagem:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao remover imagem do Docker' },
      { status: 500 }
    );
  }
}
