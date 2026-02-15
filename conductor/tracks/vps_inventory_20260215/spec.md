# Especificação da Track: Fundação do Dashboard e Inventário de Ativos Docker

## 1. Objetivo
Estabelecer a base técnica da ferramenta de gerenciamento da VPS, focando na conexão com o Docker e na visualização inicial dos ativos (Imagens e Containers).

## 2. Escopo Funcional
- **Conectividade Docker:** Estabelecer comunicação segura com o daemon do Docker no host.
- **Inventário de Imagens:** Listar todas as imagens Docker, incluindo nome, tag, ID e tamanho real em disco.
- **Inventário de Containers:** Listar containers ativos e parados, com status e mapeamento de imagem.
- **Identificação de Órfãos:** Marcar imagens sem containers vinculados e volumes sem uso.

## 3. Stack Tecnológica
- **Backend:** Node.js (TypeScript) com Docker SDK.
- **Frontend:** React (Next.js) + Tailwind CSS.
- **Comunicação:** API interna para buscar dados do Docker.

## 4. UI/UX (Conforme Diretrizes)
- **Tema:** Dark Mode.
- **Layout:** Menu lateral fixo.
- **Visualização:** Tabelas compactas com ícones descritivos.
- **Monitoramento:** Gráficos base para uso de CPU/RAM (v1).

## 5. Segurança
- Acesso administrativo via usuário `devuser`.
- Execução isolada via Docker Compose.
