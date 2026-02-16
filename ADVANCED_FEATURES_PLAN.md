# Plano de Implementação: Funcionalidades Avançadas (V2)

Este documento detalha a evolução do VPS Manager para as próximas sprints.

## 🚀 Sprint 1: Segurança e Acesso
- [ ] **Setup de Autenticação:** Implementar NextAuth.js com provedor de credenciais.
- [ ] **Proteção de Rotas:** Middleware para bloquear acesso não autorizado às APIs.
- [ ] **Audit Log v2:** Vincular ações destrutivas ao usuário logado.

## 📦 Sprint 2: Docker Compose Manager
- [ ] **Scanner de Projetos:** Localizar arquivos `.yml` no sistema de arquivos mapeado.
- [ ] **Interface de Projeto:** Agrupar containers por arquivo compose e permitir ações em lote (Up/Down).
- [ ] **Editor YAML:** Visualização e edição dos arquivos de configuração.

## 💻 Sprint 3: Web Terminal (Interactive)
- [ ] **Terminal de Container:** Acesso via `docker exec` diretamente pelo navegador usando WebSockets.
- [ ] **XTerm Integration:** UI de terminal profissional com suporte a cores e redimensionamento.

## 🛠️ Requisitos Técnicos
- Mapeamento de escrita (RW) no volume do hostfs para edição de arquivos.
- Configuração de WebSockets no Docker Compose.
