import { prisma } from '@/infrastructure/database';
import { IContainerRepository } from '@/domain/repositories/IContainerRepository';
import { Container, ContainerCreateInput, ContainerUpdateInput } from '@/domain/entities/Container';

export class PrismaContainerRepository implements IContainerRepository {
  private mapToEntity(data: {
    id: string;
    name: string;
    image: string;
    imageId: string;
    status: string;
    state: string;
    created: number;
    logSize: bigint;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt: Date;
  }): Container {
    return {
      id: data.id,
      name: data.name,
      image: data.image,
      imageId: data.imageId,
      status: data.status,
      state: data.state,
      created: data.created,
      logSize: Number(data.logSize),
      lastSeenAt: data.lastSeenAt,
    };
  }

  async findAll(): Promise<Container[]> {
    const containers = await prisma.container.findMany({
      orderBy: { lastSeenAt: 'desc' },
    });
    return containers.map(c => this.mapToEntity(c));
  }

  async findById(id: string): Promise<Container | null> {
    const container = await prisma.container.findUnique({
      where: { id },
    });
    return container ? this.mapToEntity(container) : null;
  }

  async create(input: ContainerCreateInput): Promise<Container> {
    const container = await prisma.container.create({
      data: {
        ...input,
        logSize: BigInt(input.logSize),
      },
    });
    return this.mapToEntity(container);
  }

  async update(id: string, input: ContainerUpdateInput): Promise<Container> {
    const data: Record<string, unknown> = { ...input };
    if (input.logSize !== undefined) {
      data.logSize = BigInt(input.logSize);
    }
    
    const container = await prisma.container.update({
      where: { id },
      data,
    });
    return this.mapToEntity(container);
  }

  async upsert(input: ContainerCreateInput): Promise<Container> {
    const container = await prisma.container.upsert({
      where: { id: input.id },
      update: {
        ...input,
        logSize: BigInt(input.logSize),
        lastSeenAt: new Date(),
      },
      create: {
        ...input,
        logSize: BigInt(input.logSize),
      },
    });
    return this.mapToEntity(container);
  }

  async delete(id: string): Promise<void> {
    await prisma.container.delete({
      where: { id },
    });
  }

  async getLogs(id: string): Promise<string> {
    throw new Error('Logs não são persistidos no banco de dados. Use o repositório Docker.');
  }

  async getStats(id: string): Promise<{ cpuUsage: number; memoryUsage: number; memoryLimit: number }> {
    throw new Error('Stats não são persistidos no banco de dados. Use o repositório Docker.');
  }
}
