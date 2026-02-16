import { z } from 'zod';

const configSchema = z.object({
  port: z.string().default('3000'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  docker: z.object({
    socket: z.string().default('/var/run/docker.sock'),
    timeout: z.number().default(30000),
  }),
  
  database: z.object({
    url: z.string().default('file:./dev.db'),
  }),
  
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.object({
      containers: z.number().default(30000),
      images: z.number().default(60000),
      volumes: z.number().default(30000),
      diskScan: z.number().default(300000),
    }),
  }),
  
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'pretty']).default('json'),
  }),
  
  features: z.object({
    enableRealtimeUpdates: z.boolean().default(false),
    enableAutoCleanup: z.boolean().default(false),
  }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const env = {
    port: process.env.PORT || '3000',
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    docker: {
      socket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
      timeout: parseInt(process.env.DOCKER_TIMEOUT || '30000', 10),
    },
    database: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: {
        containers: parseInt(process.env.CACHE_TTL_CONTAINERS || '30000', 10),
        images: parseInt(process.env.CACHE_TTL_IMAGES || '60000', 10),
        volumes: parseInt(process.env.CACHE_TTL_VOLUMES || '30000', 10),
        diskScan: parseInt(process.env.CACHE_TTL_DISK_SCAN || '300000', 10),
      },
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      format: (process.env.LOG_FORMAT as 'json' | 'pretty') || 'json',
    },
    features: {
      enableRealtimeUpdates: process.env.ENABLE_REALTIME_UPDATES === 'true',
      enableAutoCleanup: process.env.ENABLE_AUTO_CLEANUP === 'true',
    },
  };

  return configSchema.parse(env);
}

export const config = loadConfig();
