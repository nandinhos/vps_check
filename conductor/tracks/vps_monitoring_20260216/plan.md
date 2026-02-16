# Plano de Execução: Monitoramento de Recursos e Notificações

## Fase 1: Coleta de Métricas (Docker Stats)

- [ ] **Tarefa: Endpoint de Métricas de Recursos**
  - Implementar API para buscar CPU e RAM em tempo real usando `container.stats()`.
- [ ] **Tarefa: Visualização de Consumo no Card**
  - Adicionar pequenas barras de progresso (CPU/RAM) nos cards de containers.
- [ ] **Tarefa: Gráfico de Pizza de Recursos Global**
  - Mostrar quanto da VPS cada projeto está consumindo em termos de memória.

## Fase 2: Alertas e Notificações

- [ ] **Tarefa: Engine de Alertas de Sistema**
  - Criar lógica para detectar quando um container morre inesperadamente (Status: Die).
- [ ] **Tarefa: Integração de Notificações (Base)**
  - Implementar suporte para Webhooks de notificações (Telegram/Discord).

## Fase 3: Histórico e Tendências

- [ ] **Tarefa: Sparklines de Consumo**
  - Adicionar mini-gráficos de tendência de uso de recursos nas últimas horas.
