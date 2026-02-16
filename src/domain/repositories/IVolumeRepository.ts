import { Volume, VolumeCreateInput } from '../entities/Volume';

export interface IVolumeRepository {
  findAll(): Promise<Volume[]>;
  findByName(name: string): Promise<Volume | null>;
  create(input: VolumeCreateInput): Promise<Volume>;
  upsert(input: VolumeCreateInput): Promise<Volume>;
  delete(name: string): Promise<void>;
}
