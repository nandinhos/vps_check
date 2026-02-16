import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database';
import { comparePassword, createToken } from '@/shared/auth';
import { cookies } from 'next/headers';
import { logger } from '@/shared/logger';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      logger.warn(`Tentativa de login: Usuário não encontrado: ${username}`);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Tentativa de login: Senha incorreta para o usuário: ${username}`);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    logger.info(`Login bem-sucedido para o usuário: ${username}`);
    const token = await createToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: false, // Permitir em HTTP para testes
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
