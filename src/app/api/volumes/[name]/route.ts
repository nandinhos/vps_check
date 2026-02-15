import { NextRequest, NextResponse } from 'next/server';
import { removeVolume } from '@/lib/docker';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    await removeVolume(name);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover volume:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao remover volume do Docker' },
      { status: 500 }
    );
  }
}
