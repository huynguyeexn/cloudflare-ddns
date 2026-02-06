import { ConfigService } from '../services/config.service.js';
import { Logger } from '../utils/logger.js';
import { DdnsService } from '../services/ddns.service.js';

export async function startCommand() {
    const configService = new ConfigService();
    const config = await configService.loadOrExit();

    Logger.info('Starting Cloudflare DDNS Service...');
    Logger.info(`Interval: ${config.interval} seconds`);
    Logger.info(`Records: ${config.records.join(', ')}`);

    const ddnsService = new DdnsService();

    const loop = async () => {
        try {
            await ddnsService.performUpdate(false);
        } catch (_error) {
            // Error is handled inside performUpdate
        }

        // Reload config to get latest interval in case it changed (though rare without restart)
        const currentConfig = await configService.load();
        const interval = currentConfig?.interval || config.interval;

        setTimeout(loop, interval * 1000);
    };

    loop();
}
