import { NextResponse } from 'next/server';
import { scanDiskUsage } from '@/lib/system';

export async function GET() {
  try {
    const usage = await scanDiskUsage();
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Erro ao realizar varredura de disco:', error);
    return NextResponse.json(
      { error: 'Falha ao realizar varredura de disco' },
      { status: 500 }
    );
  }
}
