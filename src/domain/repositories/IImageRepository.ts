import { Image, ImageCreateInput } from '../entities/Image';

export interface IImageRepository {
  findAll(): Promise<Image[]>;
  findById(id: string): Promise<Image | null>;
  create(input: ImageCreateInput): Promise<Image>;
  upsert(input: ImageCreateInput): Promise<Image>;
  delete(id: string): Promise<void>;
}
