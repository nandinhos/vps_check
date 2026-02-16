import { NextRequest, NextResponse } from 'next/server';
import { getDockerClient } from '@/infrastructure/docker/DockerClient';
import { PrismaAuditLogRepository } from '@/infrastructure/database/repositories/AuditLogRepository';
import { logger } from '@/shared/logger';
import { cacheManager } from '@/shared/cache';

export const maxDuration = 60;

const auditLogRepository = new PrismaAuditLogRepository();

async function safeAuditLog(action: string, resource: string, details?: Record<string, unknown>) {
  try {
    await auditLogRepository.create({ 
      action: action as 'START_CONTAINER' | 'STOP_CONTAINER' | 'RESTART_CONTAINER' | 'DELETE_CONTAINER', 
      resource, 
      details 
    });
  } catch (auditError) {
    logger.warn('Falha ao criar audit log', auditError);
  }
}

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

  // Parar container que já está parado
  if (message.includes('is already stopped') || message.includes('already stopped')) {
    return {
      error: 'Container já está parado',
      suggestion: 'O container já está parado. Não é necessário parar novamente.'
    };
  }

  // Erro de driver de volume
  if (message.includes('driver not supported') || message.includes('not found')) {
    return {
      error: 'Driver de volume não suportado',
      suggestion: 'Verifique se o driver de volume especificado está disponível no seu Docker. Use "docker volume ls" para ver os drivers disponíveis.'
    };
  }
  
  // Erro genérico
  return {
    error: 'Erro ao executar operação',
    suggestion: 'Verifique os logs do container para mais detalhes: docker logs <nome-do-container>'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { action, id } = await request.json();
    const docker = getDockerClient();
    const container = docker.getContainer(id);

    switch (action) {
      case 'start':
        await container.start();
        await safeAuditLog('START_CONTAINER', id, { action: 'start' });
        break;

      case 'stop':
        await container.stop();
        await safeAuditLog('STOP_CONTAINER', id, { action: 'stop' });
        break;

      case 'restart':
        await container.restart();
        await safeAuditLog('RESTART_CONTAINER', id, { action: 'restart' });
        break;

      case 'delete':
        await container.remove({ force: true });
        await safeAuditLog('DELETE_CONTAINER', id, { action: 'delete' });
        break;

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    cacheManager.invalidate('containers');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const stackTrace = error instanceof Error ? error.stack : 'Stack trace não disponível';
    logger.error('Erro ao gerenciar container', error);
    
    const { error: userMessage, suggestion } = translateDockerError(message);
    
    return NextResponse.json({ 
      error: userMessage, 
      details: message,
      suggestion: suggestion,
      stackTrace: stackTrace
    }, { status: 500 });
  }
}
