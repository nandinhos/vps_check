const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { TerminalServer } = require('./dist/infrastructure/terminal/TerminalServer');

// Nota: Em ambiente standalone, o Next já gera um server.js.
// Aqui estamos criando um wrapper para carregar o WebSocket.
// Como o código TS é compilado, usaremos a versão standalone gerada pelo Next.

const path = require('path');
const nextServerPath = path.join(__dirname, '.next/standalone/server.js');

try {
  // Carrega o servidor original do Next.js
  const nextHandler = require(nextServerPath);
  console.log('Servidor Next.js Standalone carregado com sucesso.');
} catch (err) {
  console.error('Erro ao carregar o servidor standalone:', err);
  process.exit(1);
}
