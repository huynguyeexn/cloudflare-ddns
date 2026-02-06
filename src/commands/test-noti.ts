import { ConfigService } from '../services/config.service.js';
import { NotificationService } from '../services/notification.service.js';
import { Logger } from '../utils/logger.js';

export async function testNotiCommand() {
    const configService = new ConfigService();
    const config = await configService.loadOrExit();

    if (!config.notifications || !config.notifications.enabled) {
        Logger.warning('Notifications are disabled in the configuration.');
        return;
    }

    const notificationService = new NotificationService(config.notifications);

    Logger.info('Sending test notification...');
    try {
        await notificationService.send(
            'Test Notification',
            `This is a test notification from Cloudflare DDNS.\nRecords: ${config.records.join(', ')}`,
            'default'
        );
        Logger.success('Notification sent!');
    } catch (error) {
        Logger.error('Failed to send notification:', error);
    }
}
