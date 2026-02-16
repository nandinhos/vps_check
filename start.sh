#!/bin/sh

# Roda migrações do banco se necessário
npx prisma db push

# Inicia o coletor de métricas e o terminal server em background (via node no build standalone)
# Nota: No build standalone, o Next.js roda via server.js
node server.js &

# Mantém o container vivo
wait
