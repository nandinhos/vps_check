import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      }
    });
    console.log(`Usuário admin criado: ${username}`);
  } else {
    console.log(`Usuário admin já existe: ${username}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
