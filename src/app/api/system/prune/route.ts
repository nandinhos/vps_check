import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  try {
    // Executa a limpeza do build cache do Docker
    // --force evita a necessidade de confirmação interativa
    await new Promise((resolve, reject) => {
      exec('docker builder prune --force', (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout);
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao limpar build cache:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao limpar build cache do Docker' },
      { status: 500 }
    );
  }
}
