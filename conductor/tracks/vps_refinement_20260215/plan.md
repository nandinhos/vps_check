# Plano de Execução: Refinamento de UX, Busca e Performance Real-time

## Fase 1: Usabilidade e Segurança de Interface

- [ ] **Tarefa: Barra de Busca Global e Filtros de Status**
  - Implementar busca por texto (nome/imagem) e filtros por estado (Running, Exited, etc.) nas abas de Containers e Imagens.
- [ ] **Tarefa: Diálogos de Confirmação (Safety First)**
  - Adicionar `AlertDialog` para todas as ações de limpeza (Prune, Truncate, Stop, Remove).
- [ ] **Tarefa: Feedback Visual de Carregamento e Estados Vazios**
  - Refinar Skeletons e adicionar ilustrações/mensagens amigáveis para listas vazias.

## Fase 2: Logs e Visibilidade em Tempo Real

- [ ] **Tarefa: Visualizador de Logs Integrado**
  - Criar componente de terminal/log para visualizar `docker logs --tail` diretamente no Dashboard.
- [ ] **Tarefa: Infraestrutura de WebSockets/SSE**
  - Configurar backend para transmitir eventos do Docker (start/stop/die) sem necessidade de refresh.

## Fase 3: Performance e Refinamento Visual

- [ ] **Tarefa: Otimização de Varredura de Disco**
  - Implementar cache para resultados de `du` e processamento em segundo plano.
- [ ] **Tarefa: Micro-interações e Polimento de UI**
  - Adicionar animações de transição e melhorias de contraste no Dark Mode.
