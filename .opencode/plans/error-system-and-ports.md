# Plano de Implementação - VPS Manager
## Sistema de Erros e Portas

## 📋 Resumo

Este plano detalha a implementação de:
1. **Sistema de Erros Aprimorado** - Toast + Modal com histórico
2. **Portas com Links** - Acesso rápido via links clicáveis

---

## 🎯 Parte 1: Sistema de Erros Aprimorado

### 1.1 Tipos TypeScript
**Arquivo:** `src/types/error.ts`

```typescript
export interface ContainerError {
  id: string;
  timestamp: Date;
  containerId: string;
  containerName: string;
  action: string;
  title: string;
  message: string;
  suggestion: string;
  stackTrace: string;
  dockerError: string;
  apiEndpoint: string;
  isBulkError?: boolean;
  failedContainers?: FailedContainerInfo[];
}

export interface FailedContainerInfo {
  id: string;
  name: string;
  error: string;
}

export type ErrorAction = 
  | 'start' | 'stop' | 'restart' | 'delete' 
  | 'pause' | 'unpause'
  | 'bulk-start' | 'bulk-stop' | 'bulk-restart';
```

### 1.2 Store de Erros
**Arquivo:** `src/lib/hooks/use-error-store.ts`

```typescript
import { create } from 'zustand';
import { ContainerError } from '@/types/error';

interface ErrorState {
  errors: ContainerError[];
  addError: (error: ContainerError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  getErrorsByContainer: (containerId: string) => ContainerError[];
  getRecentErrors: (hours?: number) => ContainerError[];
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  
  addError: (error) => set((state) => ({
    errors: [error, ...state.errors].slice(0, 50) // Max 50 erros
  })),
  
  removeError: (id) => set((state) => ({
    errors: state.errors.filter(e => e.id !== id)
  })),
  
  clearErrors: () => set({ errors: [] }),
  
  getErrorsByContainer: (containerId) => {
    return get().errors.filter(e => e.containerId === containerId);
  },
  
  getRecentErrors: (hours = 24) => {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return get().errors.filter(e => e.timestamp.getTime() > cutoff);
  }
}));
```

### 1.3 Expandir Patterns de Erro na API
**Arquivo:** `src/app/api/containers/[id]/route.ts`

Atualizar a função de tratamento de erro:

```typescript
function translateDockerError(message: string): { error: string; suggestion: string } {
  // Porta em uso
  if (message.includes('port is already allocated') || message.includes('bind: address already in use')) {
    const portMatch = message.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : 'desconhecida';
    return {
      error: `Porta ${port} já está em uso`,
      suggestion: `Verifique se outro container ou serviço local está usando a porta ${port}. Você pode verificar com: lsof -i :${port}`
    };
  }
  
  // Imagem não encontrada
  if (message.includes('No such image')) {
    return {
      error: 'Imagem Docker não encontrada',
      suggestion: 'Execute "docker-compose pull" para baixar a imagem, ou verifique se o nome da imagem está correto no docker-compose.yml'
    };
  }
  
  // Rede não existe
  if (message.includes('network not found')) {
    return {
      error: 'Rede Docker não encontrada',
      suggestion: 'Recrie a rede com "docker network create <nome>" ou execute "docker-compose up" para criar as redes automaticamente'
    };
  }
  
  // Memória insuficiente
  if (message.includes('out of memory') || message.includes('cannot allocate memory')) {
    return {
      error: 'Memória insuficiente',
      suggestion: 'Aumente a memória alocada para o Docker Desktop ou feche aplicativos desnecessários para liberar memória'
    };
  }
  
  // Permissão negada
  if (message.includes('permission denied')) {
    return {
      error: 'Permissão negada',
      suggestion: 'Verifique se o usuário atual tem permissões para executar comandos Docker. Tente adicionar o usuário ao grupo docker: "sudo usermod -aG docker $USER"'
    };
  }
  
  // Mount/volume quebrado
  if (message.includes('not a directory') || message.includes('mount')) {
    return {
      error: 'Erro de configuração de volumes',
      suggestion: 'Verifique se os caminhos de volumes no docker-compose.yml existem no host. O erro indica que está tentando montar um diretório em um arquivo ou vice-versa'
    };
  }
  
  // Container não encontrado
  if (message.includes('container not found') || message.includes('No such container')) {
    return {
      error: 'Container não encontrado',
      suggestion: 'O container pode ter sido removido. Atualize a lista de containers.'
    };
  }
  
  // Já em execução
  if (message.includes('already started') || message.includes('already running')) {
    return {
      error: 'Container já está em execução',
      suggestion: 'O container já está rodando. Use "Reiniciar" se precisar reiniciá-lo.'
    };
  }
  
  // Não está em execução
  if (message.includes('not running') || message.includes('is not running')) {
    return {
      error: 'Container não está em execução',
      suggestion: 'Inicie o container primeiro antes de tentar parar ou reiniciar.'
    };
  }
  
  // Erro genérico
  return {
    error: 'Erro ao executar operação',
    suggestion: 'Verifique os logs do container para mais detalhes: docker logs <nome-do-container>'
  };
}
```

### 1.4 ErrorHistoryModal
**Arquivo:** `src/components/ui/error-history-modal.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useErrorStore } from '@/lib/hooks/use-error-store';
import { ContainerError, ErrorAction } from '@/types/error';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Trash2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ErrorHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function ErrorHistoryModal({ open, onClose }: ErrorHistoryModalProps) {
  const { errors, removeError, clearErrors } = useErrorStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ErrorAction | 'all'>('all');

  const filteredErrors = filter === 'all' 
    ? errors 
    : errors.filter(e => e.action === filter);

  const copyStackTrace = (error: ContainerError) => {
    navigator.clipboard.writeText(error.stackTrace);
    toast({ title: 'Stack trace copiado', variant: 'success' });
  };

  const copyAllStackTraces = () => {
    const allTraces = filteredErrors
      .map(e => `=== ${e.containerName} - ${e.action} ===\n${e.stackTrace}`)
      .join('\n\n');
    navigator.clipboard.writeText(allTraces);
    toast({ title: 'Todos os stack traces copiados', variant: 'success' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Histórico de Erros ({filteredErrors.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            {(['start', 'stop', 'restart', 'delete'] as ErrorAction[]).map(action => (
              <Button
                key={action}
                variant={filter === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(action)}
              >
                {action}
              </Button>
            ))}
          </div>

          {/* Lista de erros */}
          <Accordion type="single" collapsible className="space-y-2">
            {filteredErrors.map((error) => (
              <AccordionItem key={error.id} value={error.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full">
                    <Badge variant="destructive">{error.action}</Badge>
                    <span className="font-medium">{error.containerName}</span>
                    <span className="text-muted-foreground text-sm ml-auto">
                      {format(error.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-destructive">{error.title}</h4>
                      <p className="text-sm mt-1">{error.message}</p>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <h5 className="text-sm font-medium mb-1">Como resolver:</h5>
                      <p className="text-sm text-muted-foreground">{error.suggestion}</p>
                    </div>

                    <div className="bg-black text-green-400 p-3 rounded-md font-mono text-xs overflow-x-auto">
                      <h5 className="text-gray-400 mb-1">Stack Trace:</h5>
                      <pre className="whitespace-pre-wrap">{error.stackTrace}</pre>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyStackTrace(error)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Stack
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeError(error.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredErrors.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum erro encontrado
            </p>
          )}

          {/* Ações em massa */}
          {filteredErrors.length > 0 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={copyAllStackTraces}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar Todos
              </Button>
              <Button variant="destructive" onClick={clearErrors}>
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Histórico
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎯 Parte 2: Portas com Links de Acesso

### 2.1 Atualizar Entidade Container
**Arquivo:** `src/domain/entities/Container.ts`

```typescript
export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
  isExposed: boolean;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  logSize: number;
  ports: PortMapping[]; // NOVO CAMPO
}
```

### 2.2 Extrair Portas do Docker
**Arquivo:** `src/infrastructure/docker/repositories/ContainerRepository.ts`

```typescript
private mapDockerContainer(container: Docker.ContainerInfo): Container {
  // Extrair portas do formato do Docker
  const ports: PortMapping[] = [];
  
  if (container.Ports) {
    container.Ports.forEach(port => {
      if (port.PublicPort) {
        ports.push({
          hostPort: port.PublicPort,
          containerPort: port.PrivatePort,
          protocol: port.Type as 'tcp' | 'udp',
          isExposed: true
        });
      }
    });
  }
  
  return {
    id: container.Id,
    name: container.Names[0]?.replace(/^\//, '') || 'unnamed',
    image: container.Image,
    state: container.State,
    status: container.Status,
    created: container.Created,
    logSize: 0,
    ports // Incluir portas
  };
}
```

### 2.3 Detectar Tipo de Serviço
**Arquivo:** `src/lib/utils/ports.ts`

```typescript
export interface ServiceInfo {
  type: 'http' | 'https' | 'mysql' | 'postgres' | 'redis' | 'mongodb' | 'other';
  label: string;
  hasLink: boolean;
  copyFormat?: string;
}

const PORT_SERVICES: Record<number, ServiceInfo> = {
  80: { type: 'http', label: 'HTTP', hasLink: true },
  443: { type: 'https', label: 'HTTPS', hasLink: true },
  3000: { type: 'http', label: 'Dev Server', hasLink: true },
  3306: { type: 'mysql', label: 'MySQL', hasLink: false, copyFormat: 'mysql://{host}:{port}' },
  5432: { type: 'postgres', label: 'PostgreSQL', hasLink: false, copyFormat: 'postgresql://{host}:{port}' },
  6379: { type: 'redis', label: 'Redis', hasLink: false, copyFormat: 'redis://{host}:{port}' },
  27017: { type: 'mongodb', label: 'MongoDB', hasLink: false, copyFormat: 'mongodb://{host}:{port}' },
  8080: { type: 'http', label: 'HTTP Alt', hasLink: true },
  8443: { type: 'https', label: 'HTTPS Alt', hasLink: true },
  9000: { type: 'http', label: 'phpMyAdmin', hasLink: true },
  8081: { type: 'http', label: 'Admin', hasLink: true },
};

export function detectService(port: number): ServiceInfo {
  return PORT_SERVICES[port] || { type: 'other', label: `Port ${port}`, hasLink: false };
}

export function getConnectionString(service: ServiceInfo, host: string, port: number): string {
  if (!service.copyFormat) return `${host}:${port}`;
  return service.copyFormat.replace('{host}', host).replace('{port}', port.toString());
}

export function getServiceUrl(service: ServiceInfo, host: string, port: number): string {
  const protocol = service.type === 'https' ? 'https' : 'http';
  return `${protocol}://${host}:${port}`;
}
```

### 2.4 Detectar IP/Endereço
**Arquivo:** `src/lib/utils/network.ts`

```typescript
import os from 'os';

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const info of iface) {
      // Ignorar localhost e IPv6
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  
  return 'localhost';
}

// Hook para browser
export function useHostAddress(): string {
  const [host, setHost] = useState('localhost');
  
  useEffect(() => {
    // Tentar usar o hostname atual
    if (typeof window !== 'undefined') {
      setHost(window.location.hostname);
    }
  }, []);
  
  return host;
}
```

### 2.5 Componente PortLink
**Arquivo:** `src/components/ui/port-link.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { detectService, getServiceUrl, getConnectionString, ServiceInfo } from '@/lib/utils/ports';

interface PortLinkProps {
  hostPort: number;
  containerPort: number;
  host: string;
}

export function PortLink({ hostPort, containerPort, host }: PortLinkProps) {
  const { toast } = useToast();
  const service = detectService(containerPort);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const connectionString = getConnectionString(service, host, hostPort);
    await navigator.clipboard.writeText(connectionString);
    setIsCopied(true);
    toast({ title: 'Copiado!', variant: 'success' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const url = getServiceUrl(service, host, hostPort);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {hostPort}:{containerPort}
      </span>
      <span className="text-xs bg-muted px-2 py-0.5 rounded">
        {service.label}
      </span>
      
      {service.hasLink ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Acessar
        </a>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3 mr-1" />
          {isCopied ? 'Copiado!' : 'Copiar'}
        </Button>
      )}
    </div>
  );
}
```

### 2.6 Seção de Portas no ContainerCard
**Atualização em:** `src/components/dashboard/ContainerCard.tsx`

```typescript
// Adicionar na seção expandida do ContainerCard
{isExpanded && (
  <div className="px-4 pb-4 border-t border-border">
    <div className="grid grid-cols-3 gap-4 mt-4">
      {/* ... outros campos ... */}
      
      {/* Portas */}
      {container.ports && container.ports.length > 0 && (
        <div className="col-span-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Portas de Acesso
          </h4>
          
          {/* Agrupar por categoria */}
          {(() => {
            const webPorts = container.ports.filter(p => {
              const s = detectService(p.containerPort);
              return s.type === 'http' || s.type === 'https';
            });
            
            const dbPorts = container.ports.filter(p => {
              const s = detectService(p.containerPort);
              return ['mysql', 'postgres', 'redis', 'mongodb'].includes(s.type);
            });
            
            const otherPorts = container.ports.filter(p => {
              const s = detectService(p.containerPort);
              return !['http', 'https', 'mysql', 'postgres', 'redis', 'mongodb'].includes(s.type);
            });
            
            return (
              <div className="space-y-3">
                {webPorts.length > 0 && (
                  <div>
                    <h5 className="text-xs text-muted-foreground mb-1">🌐 Interfaces Web</h5>
                    <div className="space-y-1">
                      {webPorts.map(port => (
                        <PortLink
                          key={port.containerPort}
                          hostPort={port.hostPort}
                          containerPort={port.containerPort}
                          host={hostAddress}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {dbPorts.length > 0 && (
                  <div>
                    <h5 className="text-xs text-muted-foreground mb-1">🗄️ Bancos de Dados</h5>
                    <div className="space-y-1">
                      {dbPorts.map(port => (
                        <PortLink
                          key={port.containerPort}
                          hostPort={port.hostPort}
                          containerPort={port.containerPort}
                          host={hostAddress}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {otherPorts.length > 0 && (
                  <div>
                    <h5 className="text-xs text-muted-foreground mb-1">🔧 Outras Portas</h5>
                    <div className="space-y-1">
                      {otherPorts.map(port => (
                        <PortLink
                          key={port.containerPort}
                          hostPort={port.hostPort}
                          containerPort={port.containerPort}
                          host={hostAddress}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
    
    {/* ... ações ... */}
  </div>
)}
```

---

## 📦 Dependências Necessárias

```bash
# Zustand para state management
npm install zustand

# Date-fns para formatação de datas
npm install date-fns

# Lucide icons (já deve estar instalado)
# npm install lucide-react
```

---

## ✅ Checklist de Implementação

### Sistema de Erros
- [ ] Criar `src/types/error.ts`
- [ ] Criar `src/lib/hooks/use-error-store.ts`
- [ ] Atualizar `src/app/api/containers/[id]/route.ts` com translateDockerError
- [ ] Criar `src/components/ui/error-history-modal.tsx`
- [ ] Atualizar `src/lib/hooks/use-api.ts` para propagar erros
- [ ] Modificar `src/components/dashboard/ContainerCard.tsx` para capturar erros
- [ ] Adicionar indicador visual de problemas
- [ ] Atualizar modo bulk para toast sempre vermelho

### Portas
- [ ] Atualizar `src/domain/entities/Container.ts` com PortMapping
- [ ] Modificar `src/infrastructure/docker/repositories/ContainerRepository.ts`
- [ ] Criar `src/lib/utils/ports.ts`
- [ ] Criar `src/lib/utils/network.ts`
- [ ] Criar `src/components/ui/port-link.tsx`
- [ ] Atualizar `src/components/dashboard/ContainerCard.tsx` com seção de portas

### Testes
- [ ] Testar erro de porta em uso
- [ ] Testar erro de mount quebrado
- [ ] Testar modal de histórico
- [ ] Testar cópia de stack trace
- [ ] Testar visualização de portas HTTP
- [ ] Testar cópia de string de conexão MySQL
- [ ] Testar links de acesso em diferentes redes

---

## 🚀 Ordem de Execução Recomendada

1. **Tipos TypeScript** - Base para todo o sistema
2. **Store de Erros** - Funcionalidade core
3. **API - Patterns de Erro** - Backend
4. **Modal de Erros** - Componente UI
5. **use-api.ts** - Integração
6. **ContainerCard - Erros** - Frontend
7. **Bulk Mode** - Finalizar sistema de erros
8. **Portas - Entidade** - Backend
9. **Portas - Utils** - Helpers
10. **PortLink** - Componente
11. **ContainerCard - Portas** - Integração final
12. **Testes** - Validação

---

**Tempo Estimado:** 4-6 horas de implementação
**Complexidade:** Média-Alta
