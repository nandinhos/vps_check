/**
 * Tipos para o sistema de gerenciamento de erros
 */

export interface ContainerError {
  /** ID único do erro (UUID) */
  id: string;
  
  /** Data/hora em que o erro ocorreu */
  timestamp: Date;
  
  /** ID do container que gerou o erro */
  containerId: string;
  
  /** Nome do container */
  containerName: string;
  
  /** Ação que estava sendo executada (start, stop, restart, delete) */
  action: string;
  
  /** Título curto do erro */
  title: string;
  
  /** Mensagem amigável explicando o erro */
  message: string;
  
  /** Sugestão de como resolver o problema */
  suggestion: string;
  
  /** Stack trace completo para debug */
  stackTrace: string;
  
  /** Erro original retornado pelo Docker */
  dockerError: string;
  
  /** Endpoint da API que falhou */
  apiEndpoint: string;
  
  /** Indica se veio de operação em massa (bulk) */
  isBulkError?: boolean;
  
  /** Lista de containers que falharam (apenas para erros em bulk) */
  failedContainers?: FailedContainerInfo[];
}

export interface FailedContainerInfo {
  id: string;
  name: string;
  error: string;
}

export interface ErrorResponse {
  error: string;
  details: string;
  suggestion?: string;
  stackTrace?: string;
}

export type ErrorAction = 
  | 'start' 
  | 'stop' 
  | 'restart' 
  | 'delete' 
  | 'pause' 
  | 'unpause' 
  | 'bulk-start' 
  | 'bulk-stop' 
  | 'bulk-restart';

/** Filtros para o histórico de erros */
export interface ErrorFilters {
  containerName?: string;
  action?: ErrorAction;
  startDate?: Date;
  endDate?: Date;
}

/** Estatísticas de erros */
export interface ErrorStats {
  total: number;
  byContainer: Record<string, number>;
  byAction: Record<ErrorAction, number>;
  recentCount: number;
}
