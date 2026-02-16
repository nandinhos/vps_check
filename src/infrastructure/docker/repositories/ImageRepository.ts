import { getDockerClient } from '../DockerClient';
import { IImageRepository } from '@/domain/repositories/IImageRepository';
import { Image, ImageCreateInput } from '@/domain/entities/Image';
import { logger } from '@/shared/logger';

export class DockerImageRepository implements IImageRepository {
  private async getUsedImages(): Promise<Map<string, { id: string; name: string }[]>> {
    const docker = getDockerClient();
    const containers = await docker.listContainers({ all: true });
    const imageMap = new Map<string, { id: string; name: string }[]>();
    
    containers.forEach((c) => {
      const imageName = c.Image;
      const containerInfo = { id: c.Id, name: c.Names[0].replace(/^\//, '') };
      const existing = imageMap.get(imageName) || [];
      imageMap.set(imageName, [...existing, containerInfo]);
    });
    
    return imageMap;
  }

  private formatImage(image: Image): Image {
    return {
      ...image,
      size: Number(image.size),
    };
  }

  async findAll(): Promise<Image[]> {
    const docker = getDockerClient();
    const [images, usedImages] = await Promise.all([
      docker.listImages({ all: true }),
      this.getUsedImages(),
    ]);

    return images.map((img) => this.formatImage({
      id: img.Id,
      name: img.RepoTags?.[0] || '<none>',
      size: img.Size,
      created: typeof img.Created === 'number' ? img.Created : Date.parse(img.Created as string),
      tag: img.RepoTags?.[0]?.split(':')[1] || '<none>',
      isDangling: img.RepoTags === null || img.RepoTags?.[0] === '<none>:<none>',
      inUse: usedImages.has(img.Id),
      containers: usedImages.get(img.Id) || [],
    }));
  }

  async findById(id: string): Promise<Image | null> {
    const docker = getDockerClient();
    try {
      const image = await docker.getImage(id).inspect();
      const usedImages = await this.getUsedImages();
      
      return {
        id: image.Id,
        name: image.RepoTags?.[0] || '<none>',
        size: image.Size,
        created: typeof image.Created === 'number' ? image.Created : Date.parse(image.Created as string),
        tag: image.RepoTags?.[0]?.split(':')[1] || '<none>',
        isDangling: image.RepoTags === null || image.RepoTags?.[0] === '<none>:<none>',
        inUse: usedImages.has(image.Id),
        containers: usedImages.get(image.Id) || [],
      };
    } catch {
      return null;
    }
  }

  async create(input: ImageCreateInput): Promise<Image> {
    return this.formatImage(input);
  }

  async upsert(input: ImageCreateInput): Promise<Image> {
    return this.formatImage(input);
  }

  async delete(id: string): Promise<void> {
    const docker = getDockerClient();
    const image = docker.getImage(id);
    await image.remove({ force: true });
    logger.info('Image deleted', { imageId: id });
  }
}
