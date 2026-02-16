import { AuditLog, AuditLogCreateInput } from '../entities/AuditLog';

export interface IAuditLogRepository {
  findAll(limit?: number): Promise<AuditLog[]>;
  findByAction(action: string, limit?: number): Promise<AuditLog[]>;
  create(input: AuditLogCreateInput): Promise<AuditLog>;
}
