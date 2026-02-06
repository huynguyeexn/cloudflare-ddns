import fs from 'node:fs';
import chalk from 'chalk';
import path from 'node:path';
import os from 'node:os';

export async function logsCommand(options: { lines: string; follow: boolean }) {
    // We need to get the log file path. Since Logger.logFile is private, 
    // we'll reconstruct it or add a getter. 
    // Let's just reconstruct it here to match Logger's default.
    const logFile = path.join(os.homedir(), '.config', 'cloudflare-ddns', 'app.log');

    if (!fs.existsSync(logFile)) {
        console.log(chalk.yellow(`Log file not found at: ${logFile}`));
        return;
    }

    const numLines = parseInt(options.lines) || 20;

    if (options.follow) {
        console.log(chalk.cyan(`Following logs: ${logFile} (Ctrl+C to stop)`));

        // Show last N lines first
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n');
        lines.slice(-numLines).forEach(line => console.log(line));

        // Watch file
        let fileSize = fs.statSync(logFile).size;
        fs.watchFile(logFile, { interval: 500 }, (curr) => {
            if (curr.size > fileSize) {
                const stream = fs.createReadStream(logFile, {
                    start: fileSize,
                    end: curr.size
                });
                stream.on('data', (chunk) => {
                    process.stdout.write(chunk);
                });
                fileSize = curr.size;
            } else if (curr.size < fileSize) {
                // File was truncated/rotated
                fileSize = curr.size;
                console.log(chalk.blue('--- Log rotated ---'));
            }
        });

        // Keep process alive
        process.on('SIGINT', () => {
            fs.unwatchFile(logFile);
            process.exit(0);
        });
    } else {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n');
        console.log(chalk.cyan(`Showing last ${numLines} lines of ${logFile}:`));
        lines.slice(-numLines).forEach(line => console.log(line));
    }
}
