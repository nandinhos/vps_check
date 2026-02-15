import { NextRequest, NextResponse } from 'next/server';
import { clearContainerLogs } from '@/lib/docker';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await clearContainerLogs(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao limpar logs:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao limpar logs do container' },
      { status: 500 }
    );
  }
}
