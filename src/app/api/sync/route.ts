import { NextRequest, NextResponse } from 'next/server';
import { backgroundSync } from '@/shared/sync';
import { logger } from '@/shared/logger';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      backgroundSync.start(60000);
      return NextResponse.json({ success: true, status: backgroundSync.getStatus() });
    }

    if (action === 'stop') {
      backgroundSync.stop();
      return NextResponse.json({ success: true, status: backgroundSync.getStatus() });
    }

    if (action === 'sync') {
      await backgroundSync.syncAll();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    logger.error('Erro ao gerenciar sync', error);
    return NextResponse.json({ error: 'Erro ao gerenciar sync' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(backgroundSync.getStatus());
}
