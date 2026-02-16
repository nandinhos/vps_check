import { logger } from '@/shared/logger';

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export class NotificationService {
  private static async sendToDiscord(webhookUrl: string, payload: NotificationPayload) {
    const color = payload.severity === 'CRITICAL' ? 0xff0000 : payload.severity === 'WARNING' ? 0xffff00 : 0x00ff00;
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: payload.title,
            description: payload.message,
            color: color,
            timestamp: new Date().toISOString(),
          }]
        }),
      });
    } catch (err) {
      logger.error('Falha ao enviar notificação para Discord', err);
    }
  }

  static async notify(payload: NotificationPayload) {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (discordUrl) {
      await this.sendToDiscord(discordUrl, payload);
    }
    
    // Log local sempre
    logger.info(`[NOTIFICAÇÃO ${payload.severity}] ${payload.title}: ${payload.message}`);
  }
}
