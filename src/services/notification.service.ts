import { type Config } from './config.service.js';
import { Logger } from '../utils/logger.js';

export class NotificationService {
    constructor(private config: Config['notifications']) { }

    async send(title: string, message: string, priority: 'default' | 'high' | 'low' = 'default') {
        if (!this.config || !this.config.enabled) return;

        if (this.config.provider === 'ntfy') {
            await this.sendNtfy(title, message, priority);
        }
    }

    private async sendNtfy(title: string, message: string, priority: string) {
        if (!this.config?.ntfy?.topic) return;

        const url = this.config.ntfy.url || 'https://ntfy.sh';
        // Remove trailing slash if present
        const cleanUrl = url.replace(/\/$/, '');
        const target = `${cleanUrl}/${this.config.ntfy.topic}`;

        try {
            const headers: Record<string, string> = {
                'Title': title,
                'Priority': priority === 'high' ? 'high' : (priority === 'low' ? 'low' : 'default'),
            };

            if (this.config.ntfy.token) {
                headers['Authorization'] = `Bearer ${this.config.ntfy.token}`;
            }

            const response = await fetch(target, {
                method: 'POST',
                body: message,
                headers
            });

            if (!response.ok) {
                Logger.error(`Failed to send NTFY notification: ${response.statusText}`);
            }
        } catch (error) {
            Logger.error('Error sending NTFY notification:', error);
        }
    }
}
