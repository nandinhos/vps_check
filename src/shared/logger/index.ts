import winston from 'winston';
import { config } from '@/config/app';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  config.logging.format === 'json'
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'vps-manager' },
  transports: [
    new winston.transports.Console({
      format: config.logging.format === 'pretty'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json(),
    }),
  ],
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
