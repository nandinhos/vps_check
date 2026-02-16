import { config } from '@/config/app';
import { logger } from '@/shared/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTtl: number;

  constructor(defaultTtl = 60000) {
    this.defaultTtl = defaultTtl;
    
    if (config.cache.enabled) {
      setInterval(() => this.cleanup(), 60000);
      logger.info('Cache manager initialized', { defaultTtl });
    }
  }

  get<T>(key: string): T | undefined {
    if (!config.cache.enabled) return undefined;

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      logger.debug('Cache miss', { key });
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return undefined;
    }

    logger.debug('Cache hit', { key });
    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (!config.cache.enabled) return;

    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + (ttl || this.defaultTtl),
    };
    
    this.cache.set(key, entry);
    logger.debug('Cache set', { key, ttl: ttl || this.defaultTtl });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug('Cache invalidated', { key });
  }

  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug('Cache invalidated by pattern', { pattern, count });
    }
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup', { cleaned, remaining: this.cache.size });
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      enabled: config.cache.enabled,
      ttl: this.defaultTtl,
    };
  }
}

export const cacheManager = new CacheManager(config.cache.ttl.containers);
