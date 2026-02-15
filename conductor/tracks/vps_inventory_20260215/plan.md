# Plano de Execução: Fundação do Dashboard e Inventário de Ativos Docker

## Fase 1: Setup do Projeto e Conectividade Docker [checkpoint: 918a674]

- [x] **Tarefa: Inicialização do Projeto Next.js** (190fa0c)
  - Configurar scaffold inicial com Next.js, TypeScript e Tailwind CSS.
- [x] **Tarefa: Configuração do Backend e Docker SDK** (6548406)
  - **Escrever Testes:** Validar a conexão com o Docker SDK.
  - **Implementar:** Criar o serviço de conexão com o Docker Engine.
- [x] **Tarefa: Conductor - User Manual Verification 'Setup e Conectividade' (Protocol in workflow.md)** (918a674)

## Fase 2: API de Inventário e Dashboard Base [checkpoint: 8a214e0]

- [x] **Tarefa: API de Listagem de Imagens** (7adfd37)
  - **Escrever Testes:** Validar o retorno da lista de imagens com tamanhos.
  - **Implementar:** Endpoint API para buscar imagens via SDK.
- [x] **Tarefa: API de Listagem de Containers** (2739ae0)
  - **Escrever Testes:** Validar o retorno da lista de containers e status.
  - **Implementar:** Endpoint API para buscar containers.
- [x] **Tarefa: Interface do Dashboard (Tabela de Ativos)** (d1b4365)
  - **Escrever Testes:** Validar renderização da tabela no frontend.
  - **Implementar:** Criar tabelas compactas usando Tailwind CSS para exibir o inventário.
- [x] **Tarefa: Conductor - User Manual Verification 'Dashboard e Inventário' (Protocol in workflow.md)** (8a214e0)

## Fase 3: Varredura de Disco Profunda e Gerenciamento de Volumes/Logs

- [x] **Tarefa: API de Inventário de Volumes** (3eab502)
  - **Escrever Testes:** Validar listagem de volumes e detecção de volumes órfãos.
  - **Implementar:** Endpoint para listar volumes e seu uso estimado de disco.
- [x] **Tarefa: API de Analise de Logs de Containers** (ae2428b)
  - **Escrever Testes:** Validar cálculo de tamanho de arquivos de log no `/var/lib/docker/containers`.
  - **Implementar:** Endpoint para identificar containers com logs excessivos.
- [x] **Tarefa: Ferramenta de Varredura de Disco do Sistema** (df716b3)
  - **Escrever Testes:** Validar identificação de diretórios grandes (fora do Docker).
  - **Implementar:** Serviço para executar `du -sh` em pastas críticas (`/var/log`, `/tmp`, `/var/cache`).
- [x] **Tarefa: CRUD de Limpeza (Volumes e Logs)** (2afa502)
  - **Implementar:** Botões para remover volumes órfãos e truncar logs de containers.
- [~] **Tarefa: Expansão da Varredura (Cache, APT e Journal)**
  - **Implementar:** Monitoramento de Build Cache do Docker, Journal do Sistema e diretórios do APT.
- [ ] **Tarefa: Conductor - User Manual Verification 'Limpeza e Varredura' (Protocol in workflow.md)**
