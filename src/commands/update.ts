import { DdnsService } from '../services/ddns.service.js';
import { Logger } from '../utils/logger.js';

export async function updateCommand(options: { force: boolean }) {
    const ddnsService = new DdnsService();

    try {
        Logger.info(`Running manual update${options.force ? ' (FORCE)' : ''}...`);
        await ddnsService.performUpdate(options.force);
    } catch (_error) {
        // Error is already logged in ddnsService
        process.exit(1);
    }
}
