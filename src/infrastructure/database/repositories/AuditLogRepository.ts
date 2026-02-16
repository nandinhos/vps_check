import { prisma } from '@/infrastructure/database';
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { AuditLog, AuditLogCreateInput } from '@/domain/entities/AuditLog';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  private mapToEntity(data: {
    id: string;
    action: string;
    resource: string;
    details: string | null;
    userId: string | null;
    createdAt: Date;
  }): AuditLog {
    return {
      id: data.id,
      action: data.action as AuditLog['action'],
      resource: data.resource,
      details: data.details ? JSON.parse(data.details) : undefined,
      userId: data.userId || undefined,
      createdAt: data.createdAt,
    };
  }

  async findAll(limit = 100): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs.map(l => this.mapToEntity(l));
  }

  async findByAction(action: string, limit = 50): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs.map(l => this.mapToEntity(l));
  }

  async create(input: AuditLogCreateInput): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
      data: {
        action: input.action,
        resource: input.resource,
        details: input.details ? JSON.stringify(input.details) : null,
        userId: input.userId || null,
      },
    });
    return this.mapToEntity(log);
  }
}
