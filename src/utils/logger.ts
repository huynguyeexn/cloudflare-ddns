import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';

import os from 'node:os';

export class Logger {
    private static logFile: string = path.join(os.homedir(), '.config', 'cloudflare-ddns', 'app.log');

    static setLogFile(filePath: string) {
        this.logFile = filePath;
    }

    private static MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
    private static MAX_LOG_FILES = 5;

    // For testing purposes
    static setMaxLogSize(size: number) {
        this.MAX_LOG_SIZE = size;
    }

    static setMaxLogFiles(count: number) {
        this.MAX_LOG_FILES = count;
    }

    private static async rotateLogs() {
        try {
            const stats = await fs.stat(this.logFile);
            if (stats.size < this.MAX_LOG_SIZE) return;

            // Generate timestamped filename
            const now = new Date();
            // Format: YYYY-MM-DD_HH-mm-ss
            const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
            const backupPath = `${this.logFile}.${timestamp}`;

            // Rename current log file
            await fs.rename(this.logFile, backupPath);

            // Cleanup old logs
            const logDir = path.dirname(this.logFile) || '.';
            const logName = path.basename(this.logFile);

            // List files in directory
            const files = await fs.readdir(logDir);

            // Filter for backup files (app.log.2024-...)
            // Standard strictly starts with logName + "."
            const backupFiles = files.filter(f => f.startsWith(logName + '.') && f !== logName);

            // Sort to find oldest. 
            // ISO timestamps sort alphabetically correctly (descending = newest first)
            backupFiles.sort().reverse();

            if (backupFiles.length > this.MAX_LOG_FILES) {
                const toDelete = backupFiles.slice(this.MAX_LOG_FILES);
                for (const file of toDelete) {
                    try {
                        await fs.unlink(path.join(logDir, file));
                    } catch {
                        // ignore
                    }
                }
            }

        } catch (_error) {
            // Ignore (file might not exist yet)
        }
    }

    private static async writeToFile(level: string, message: string) {
        await this.rotateLogs();
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${level}] ${message}\n`;
        try {
            await fs.appendFile(this.logFile, logLine);
        } catch (_error) {
            // Ignore logging errors to prevent infinite loops
        }
    }

    static async info(message: string, ...args: unknown[]) {
        console.log(chalk.green('INFO:'), message, ...args);
        await this.writeToFile('INFO', `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`);
    }

    static async error(message: string, ...args: unknown[]) {
        console.error(chalk.red('ERROR:'), message, ...args);
        await this.writeToFile('ERROR', `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`);
    }

    static async success(message: string, ...args: unknown[]) {
        console.log(chalk.greenBright('SUCCESS:'), message, ...args);
        await this.writeToFile('SUCCESS', `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`);
    }

    static async warning(message: string, ...args: unknown[]) {
        console.warn(chalk.yellow('WARN:'), message, ...args);
        await this.writeToFile('WARN', `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`);
    }
}
