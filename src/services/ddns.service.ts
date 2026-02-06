import { ConfigService } from './config.service.js';
import { CloudflareService } from './cloudflare.service.js';
import { IpService } from './ip.service.js';
import { Logger } from '../utils/logger.js';
import { NotificationService } from './notification.service.js';

export class DdnsService {
    private configService: ConfigService;
    private cfService: CloudflareService | null = null;
    private notificationService: NotificationService | null = null;

    constructor() {
        this.configService = new ConfigService();
    }

    async performUpdate(force: boolean = false): Promise<void> {
        const config = await this.configService.load();
        if (!config) {
            throw new Error('Configuration not found. Please run "cfddns setup" first.');
        }

        if (!this.cfService) {
            this.cfService = new CloudflareService(config.apiToken);
        }
        if (!this.notificationService) {
            this.notificationService = new NotificationService(config.notifications);
        }

        try {
            const ipv4 = await IpService.getIpV4();
            const ipv6 = await IpService.getIpV6();

            Logger.info(`Detected IPv4: ${ipv4 || 'null'}, IPv6: ${ipv6 || 'null'}`);

            let ipChanged = false;
            const currentLastKnown = config.lastKnownIp || {};

            if (ipv4 && ipv4 !== currentLastKnown.v4) {
                Logger.info(`IPv4 changed: ${currentLastKnown.v4 || 'None'} -> ${ipv4}`);
                ipChanged = true;
            }

            if (ipv6 && ipv6 !== currentLastKnown.v6) {
                Logger.info(`IPv6 changed: ${currentLastKnown.v6 || 'None'} -> ${ipv6}`);
                ipChanged = true;
            }

            if (ipChanged || force) {
                if (force && !ipChanged) {
                    Logger.info('Force update triggered. Updating Cloudflare records...');
                } else if (ipChanged) {
                    Logger.info('IP Address changed. Updating Cloudflare records...');
                }

                const zones = await this.cfService.getZones();
                const updates: Promise<unknown>[] = [];

                for (const zone of zones) {
                    const records = await this.cfService.getRecords(zone.id);

                    for (const record of records) {
                        if (config.records.includes(record.name)) {
                            if (record.type === 'A' && ipv4) {
                                if (record.content !== ipv4 || force) {
                                    Logger.info(`Updating ${record.name} (A) to ${ipv4}`);
                                    updates.push(this.cfService.updateRecord(record, ipv4));
                                } else {
                                    Logger.info(`Record ${record.name} (A) is already up to date.`);
                                }
                            }

                            if (record.type === 'AAAA' && ipv6) {
                                if (record.content !== ipv6 || force) {
                                    Logger.info(`Updating ${record.name} (AAAA) to ${ipv6}`);
                                    updates.push(this.cfService.updateRecord(record, ipv6));
                                } else {
                                    Logger.info(`Record ${record.name} (AAAA) is already up to date.`);
                                }
                            }
                        }
                    }
                }

                await Promise.all(updates);

                // Save new IPs
                config.lastKnownIp = { v4: ipv4 || undefined, v6: ipv6 || undefined };
                config.lastSuccess = new Date().toISOString();
                config.lastMessage = force ? 'Force update completed successfully.' : 'Service is running normally.';
                await this.configService.save(config);

                Logger.success('Update completed.');

                if (ipChanged) {
                    const message = `Records: ${config.records.join(', ')}\nIPv4: ${ipv4 || 'N/A'}\nIPv6: ${ipv6 || 'N/A'}`;
                    await this.notificationService.send('IP Address Changed', message, 'high');
                } else if (force) {
                    const message = `Manual force update triggered.\nRecords: ${config.records.join(', ')}\nIPv4: ${ipv4 || 'N/A'}\nIPv6: ${ipv6 || 'N/A'}`;
                    await this.notificationService.send('Force Update Completed', message, 'default');
                }
            } else {
                Logger.info('IPs unchanged.');
                config.lastSuccess = new Date().toISOString();
                config.lastMessage = 'Service is running normally.';
                await this.configService.save(config);
            }
        } catch (error) {
            Logger.error('Error during update:', error);
            if (this.notificationService) {
                await this.notificationService.send('Cloudflare DDNS Error', String(error), 'high');
            }

            try {
                const currentConfig = await this.configService.load();
                if (currentConfig) {
                    currentConfig.lastMessage = `Error: ${String(error)}`;
                    await this.configService.save(currentConfig);
                }
            } catch (saveError) {
                Logger.error('Failed to save error state to config:', saveError);
            }
            throw error;
        }
    }
}
