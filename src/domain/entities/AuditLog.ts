export type AuditAction = 
  | 'DELETE_IMAGE'
  | 'DELETE_CONTAINER'
  | 'DELETE_VOLUME'
  | 'CLEAR_LOGS'
  | 'PRUNE_BUILD_CACHE'
  | 'PRUNE_SYSTEM'
  | 'START_CONTAINER'
  | 'STOP_CONTAINER'
  | 'RESTART_CONTAINER'
  | 'PAUSE_CONTAINER'
  | 'UNPAUSE_CONTAINER'
  | 'COMPOSE_UP'
  | 'COMPOSE_DOWN'
  | 'COMPOSE_RESTART'
  | 'COMPOSE_PULL'
  | 'TERMINAL_OPEN';

export interface AuditLog {
  id: string;
  action: AuditAction;
  resource: string;
  details?: Record<string, unknown>;
  userId?: string;
  createdAt: Date;
}

export interface AuditLogCreateInput {
  action: AuditAction;
  resource: string;
  details?: Record<string, unknown>;
  userId?: string;
}
