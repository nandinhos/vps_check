import { Container, ContainerCreateInput, ContainerUpdateInput } from '../entities/Container';

export interface IContainerRepository {
  findAll(): Promise<Container[]>;
  findById(id: string): Promise<Container | null>;
  create(input: ContainerCreateInput): Promise<Container>;
  update(id: string, input: ContainerUpdateInput): Promise<Container>;
  upsert(input: ContainerCreateInput): Promise<Container>;
  delete(id: string): Promise<void>;
}
