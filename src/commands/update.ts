import { DdnsService } from '../services/ddns.service.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function updateCommand(options: { force: boolean }) {
    const ddnsService = new DdnsService();

    try {
        Logger.info(`Running manual update${options.force ? ' (FORCE)' : ''}...`);
        await ddnsService.performUpdate(options.force);
    } catch (error) {
        // Error is already logged in ddnsService
        process.exit(1);
    }
}
