import { ConfigService } from '../services/config.service.js';
import { CloudflareService } from '../services/cloudflare.service.js';
import { IpService } from '../services/ip.service.js';
import { Logger } from '../utils/logger.js';

export async function startCommand() {
    const configService = new ConfigService();
    const config = await configService.load();

    if (!config) {
        Logger.error('Configuration not found. Please run "cfddns setup" first.');
        process.exit(1);
    }

    Logger.info('Starting Cloudflare DDNS Service...');
    Logger.info(`Interval: ${config.interval} seconds`);
    Logger.info(`Records: ${config.records.join(', ')}`);

    const cfService = new CloudflareService(config.apiToken);

    const loop = async () => {
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

            if (ipChanged) {
                Logger.info('IP Address changed. Updating Cloudflare records...');

                // Fetch records again to get IDs (IDs might change if recreated, but usually stable)
                // But we need to map names to IDs.
                // Optimization: We could cache zone IDs, but fetching records is safer.

                // 1. Get Zones (we don't know which zone the record belongs to without checking all)
                const zones = await cfService.getZones();

                const updates: Promise<unknown>[] = [];

                for (const zone of zones) {
                    const records = await cfService.getRecords(zone.id);

                    for (const record of records) {
                        if (config.records.includes(record.name)) {
                            // Update if type matches IP available
                            if (record.type === 'A' && ipv4) {
                                if (record.content !== ipv4) {
                                    Logger.info(`Updating ${record.name} (A) to ${ipv4}`);
                                    updates.push(cfService.updateRecord(record, ipv4));
                                } else {
                                    Logger.info(`Record ${record.name} (A) is already up to date.`);
                                }
                            }

                            if (record.type === 'AAAA' && ipv6) {
                                if (record.content !== ipv6) {
                                    Logger.info(`Updating ${record.name} (AAAA) to ${ipv6}`);
                                    updates.push(cfService.updateRecord(record, ipv6));
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
                await configService.save(config);
                Logger.success('Update completed.');
            } else {
                // Logger.info('IPs unchanged.');
                // Don't log on every loop to keep log clean, unless debug?
                // configService might have a setting for verbose logging.
            }
        } catch (error) {
            Logger.error('Error in loop:', error);
        }

        setTimeout(loop, config.interval * 1000);
    };

    loop();
}
