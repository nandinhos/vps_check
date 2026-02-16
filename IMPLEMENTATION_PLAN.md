# Plano de Implementação - VPS Manager

## ✅ Concluído

### Fase 1 - Fundação (COMPLETO)
- [x] Reorganização da arquitetura (Clean Architecture)
- [x] Setup do Prisma + SQLite
- [x] Sistema de logging estruturado (Winston)
- [x] Configuração tipada com Zod

### Fase 2 - Core Features (COMPLETO)
- [x] Cache em memória com TTL
- [x] Background sync para dados Docker
- [x] Health checks
- [x] APIs com cache

### UI/UX Completa (COMPLETO)
- [x] Componentes shadcn/ui (Button, Card, Badge, Skeleton, Progress, DropdownMenu)
- [x] TanStack Query para data fetching
- [x] TanStack Table para tabelas
- [x] Recharts para gráficos
- [x] Dashboard com abas (Visão Geral, Containers, Imagens, Volumes)
- [x] Stats Cards animadas
- [x] Skeleton loading states
- [x] Dark mode por padrão

---

## ✅ Tasks Concluídas

### 1. Sistema de Toast Notifications ✅
- [x] Componente toast.tsx
- [x] ToastProvider no layout
- [x] useToast hook
- [x] Integração em ContainersTable, ImagesTable, VolumesTable, page.tsx

### 2. Modal de Confirmações ✅
- [x] AlertDialog component (shadcn/ui)
- [x] Modal em ImagesTable (confirmar删除 imagem)
- [x] Modal em VolumesTable (confirmar删除 volume)

---

## 📋 Próximas Tasks Pendentes

---

### 3. Theme Toggle (Dark/Light)
**Prioridade:** Baixa
**Descrição:** Adicionar alternância de tema dark/light

**Arquivos a criar/modificar:**
```
src/components/theme-provider.tsx
src/app/layout.tsx
src/app/page.tsx (adicionar toggle)
```

**Dependências necessárias:**
```bash
npm install next-themes
```

---

### 4. Dashboard Customizável (Drag & Drop)
**Prioridade:** Baixa
**Descrição:** Permitir reorganizar widgets do dashboard

**Arquivos a criar:**
```
src/components/dashboard/draggable-grid.tsx
```

**Dependências necessárias:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

---

### 5. Sistema de Plugins
**Prioridade:** Baixa
**Descrição:** Tornar a ferramenta extensível com plugins

**Arquivos a criar:**
```
src/lib/plugins/plugin-manager.ts
src/lib/plugins/types.ts
src/components/plugins/
```

**Funcionalidades:**
- Scanners customizados
- Ações automatizadas
- Widgets adicionais
- Notificações (Slack, Email)

---

### 6. Autenticação JWT
**Prioridade:** Baixa
**Descrição:** Adicionar login e controle de acesso

**Arquivos a criar:**
```
src/app/api/auth/route.ts
src/middleware.ts
src/components/auth/login-form.tsx
```

**Dependências necessárias:**
```bash
npm install jsonwebtoken bcrypt
```

---

### 7. Rate Limiting
**Prioridade:** Baixa
**Descrição:** Proteger APIs contra abuso

**Arquivos a criar/modificar:**
```
src/middleware.ts (adicionar rate limit)
```

**Dependências necessárias:**
```bash
npm install rate-limiter-flexible
```

---

### 8. Background Jobs (BullMQ)
**Prioridade:** Baixa
**Descrição:** Processar operações pesadas em background

**Arquivos a criar:**
```
src/lib/queue/worker.ts
src/lib/queue/jobs.ts
```

**Dependências necessárias:**
```bash
npm install bullmq ioredis
```

---

### 9. Testes de Integração
**Prioridade:** Média
**Descrição:** Aumentar cobertura de testes

**Melhorias:**
- Testar APIs com supertest
- Testar repositories com mocks
- Testar UI com React Testing Library

---

### 10. CI/CD - GitHub Actions
**Prioridade:** Baixa
**Descrição:** Automatizar build, testes e deploy

**Arquivos a criar:**
```
.github/workflows/ci.yml
.github/workflows/release.yml
```

---

## 📅 Sugestão de Execução

### Ordem recomendada:

1. **Semana 1:** Toast Notifications + Modal Confirmações (impacto UX alto, esforço baixo)

2. **Semana 2:** Theme Toggle + Testes de Integração

3. **Semana 3:** Dashboard Customizável

4. **Semana 4:** Sistema de Plugins (foundation)

5. **Semana 5-6:** Autenticação + Rate Limiting

6. **Semana 7-8:** Background Jobs

7. **Semana 9:** CI/CD

---

## 🚀 Como Executar Este Plano

Para executar cada task individualmente:

```bash
# Task 1: Toast
npm run dev  # já funciona, apenas criar componentes

# Task 2: Modal
# Criar alert-dialog.tsx

# Task 3: Theme
npm install next-themes

# Task 4: Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable

# Task 5-8: Instalar deps
npm install jsonwebtoken bcrypt rate-limiter-flexible bullmq ioredis
```

---

## 📁 Estrutura Atual do Projeto

```
vps_check/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── containers/
│   │   │   ├── images/
│   │   │   ├── volumes/
│   │   │   ├── system/
│   │   │   ├── health/
│   │   │   └── sync/
│   │   ├── page.tsx           # Dashboard principal
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Componentes shadcn
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   └── dropdown-menu.tsx
│   │   └── dashboard/          # Componentes dashboard
│   │       ├── DashboardStats.tsx
│   │       ├── DiskUsageChart.tsx
│   │       ├── ContainersTable.tsx
│   │       ├── ImagesTable.tsx
│   │       └── VolumesTable.tsx
│   ├── domain/                 # Camada de domínio
│   │   ├── entities/
│   │   └── repositories/
│   ├── infrastructure/         # Implementações
│   │   ├── docker/
│   │   ├── database/
│   │   └── system/
│   ├── shared/                 # Utilitários
│   │   ├── cache/
│   │   ├── sync/
│   │   ├── logger/
│   │   ├── errors/
│   │   └── types/
│   ├── config/                 # Configurações
│   └── lib/                    # Hooks e utils
│       ├── hooks/use-api.ts
│       ├── query-provider.tsx
│       └── utils.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Lint
npm run lint

# Testes
npm run test

# Database
npm run db:generate  # gerar client
npm run db:push      # aplicar schema

# Prune Docker (dentro do container)
docker builder prune --force
```
