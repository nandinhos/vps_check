import { logger } from '@/shared/logger';
import { DockerContainerRepository } from '@/infrastructure/docker/repositories/ContainerRepository';
import { DockerImageRepository } from '@/infrastructure/docker/repositories/ImageRepository';
import { DockerVolumeRepository } from '@/infrastructure/docker/repositories/VolumeRepository';
import { scanDiskUsage } from '@/infrastructure/system/SystemScanner';
import { cacheManager } from '@/shared/cache';

const containerRepo = new DockerContainerRepository();
const imageRepo = new DockerImageRepository();
const volumeRepo = new DockerVolumeRepository();

export class BackgroundSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  async syncContainers(): Promise<void> {
    try {
      const containers = await containerRepo.findAll();
      cacheManager.set('containers', containers, 30000);
      logger.info('Containers synced', { count: containers.length });
    } catch (error) {
      logger.error('Failed to sync containers', error);
    }
  }

  async syncImages(): Promise<void> {
    try {
      const images = await imageRepo.findAll();
      cacheManager.set('images', images, 60000);
      logger.info('Images synced', { count: images.length });
    } catch (error) {
      logger.error('Failed to sync images', error);
    }
  }

  async syncVolumes(): Promise<void> {
    try {
      const volumes = await volumeRepo.findAll();
      cacheManager.set('volumes', volumes, 30000);
      logger.info('Volumes synced', { count: volumes.length });
    } catch (error) {
      logger.error('Failed to sync volumes', error);
    }
  }

  async syncDiskScan(): Promise<void> {
    try {
      const scan = await scanDiskUsage();
      cacheManager.set('diskScan', scan, 300000);
      logger.info('Disk scan synced', { paths: scan.length });
    } catch (error) {
      logger.error('Failed to sync disk scan', error);
    }
  }

  async syncAll(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Sync already in progress, skipping');
      return;
    }

    this.isRunning = true;
    logger.info('Starting full sync');

    try {
      await Promise.all([
        this.syncContainers(),
        this.syncImages(),
        this.syncVolumes(),
        this.syncDiskScan(),
      ]);
      logger.info('Full sync completed');
    } catch (error) {
      logger.error('Full sync failed', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(intervalMs = 60000): void {
    if (this.syncInterval) {
      logger.warn('Background sync already running');
      return;
    }

    logger.info('Starting background sync', { intervalMs });
    
    this.syncAll();
    
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Background sync stopped');
    }
  }

  getStatus() {
    return {
      running: this.syncInterval !== null,
      isRunning: this.isRunning,
    };
  }
}

export const backgroundSync = new BackgroundSync();
