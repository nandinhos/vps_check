import { NextRequest, NextResponse } from 'next/server';
import { exploreDirectory } from '@/infrastructure/system/SystemScanner';
import { logger } from '@/shared/logger';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 });
  }

  try {
    const details = await exploreDirectory(path);
    return NextResponse.json(details);
  } catch (error) {
    logger.error(`Erro ao explorar diretório ${path}`, error);
    return NextResponse.json({ error: 'Falha ao explorar diretório' }, { status: 500 });
  }
}
