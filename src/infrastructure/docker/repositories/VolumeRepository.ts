import { getDockerClient } from '../DockerClient';
import { IVolumeRepository } from '@/domain/repositories/IVolumeRepository';
import { Volume, VolumeCreateInput } from '@/domain/entities/Volume';
import { logger } from '@/shared/logger';

export class DockerVolumeRepository implements IVolumeRepository {
  private async getUsedVolumeNames(): Promise<Set<string>> {
    const docker = getDockerClient();
    const containers = await docker.listContainers({ all: true });
    const usedVolumes = new Set<string>();
    
    containers.forEach((container) => {
      container.Mounts.forEach((mount) => {
        if (mount.Name) {
          usedVolumes.add(mount.Name);
        }
      });
    });
    
    return usedVolumes;
  }

  private formatVolume(volume: Volume): Volume {
    return {
      ...volume,
      size: volume.size ? Number(volume.size) : undefined,
    };
  }

  async findAll(): Promise<Volume[]> {
    const docker = getDockerClient();
    const [volumesData, usedVolumes] = await Promise.all([
      docker.listVolumes(),
      this.getUsedVolumeNames(),
    ]);

    return (volumesData.Volumes || []).map((v) => this.formatVolume({
      name: v.Name,
      driver: v.Driver,
      mountpoint: v.Mountpoint,
      inUse: usedVolumes.has(v.Name),
    }));
  }

  async findByName(name: string): Promise<Volume | null> {
    const docker = getDockerClient();
    try {
      const volume = await docker.getVolume(name).inspect();
      const usedVolumes = await this.getUsedVolumeNames();
      
      return this.formatVolume({
        name: volume.Name,
        driver: volume.Driver,
        mountpoint: volume.Mountpoint,
        inUse: usedVolumes.has(volume.Name),
      });
    } catch {
      return null;
    }
  }

  async create(input: VolumeCreateInput): Promise<Volume> {
    return this.formatVolume(input);
  }

  async upsert(input: VolumeCreateInput): Promise<Volume> {
    return this.formatVolume(input);
  }

  async delete(name: string): Promise<void> {
    const docker = getDockerClient();
    const volume = docker.getVolume(name);
    await volume.remove({ force: true });
    logger.info('Volume deleted', { volumeName: name });
  }
}
