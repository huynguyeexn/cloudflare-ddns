import { ConfigService } from '../services/config.service.js';
import chalk from 'chalk';
import { exec } from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(exec);

export async function statusCommand() {
    const configService = new ConfigService();
    const config = await configService.load();

    if (!config) {
        console.log(chalk.red('Configuration not found. Please run "cfddns setup" first.'));
        process.exit(1);
    }

    console.log(chalk.bold('\n📊 Cloudflare DDNS Status\n'));

    // 1. IP Information
    const v4 = config.lastKnownIp?.v4 || chalk.gray('Unknown');
    const v6 = config.lastKnownIp?.v6 || chalk.gray('Unknown');

    console.log(`  ${chalk.cyan('IPv4:')} ${v4}`);
    console.log(`  ${chalk.cyan('IPv6:')} ${v6}`);

    // 2. Last Update
    const lastSuccess = config.lastSuccess ? new Date(config.lastSuccess) : null;
    let timeAgoStr = 'Never';
    let isStale = true;

    if (lastSuccess) {
        const diffMs = Date.now() - lastSuccess.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) timeAgoStr = 'Just now';
        else if (diffMins < 60) timeAgoStr = `${diffMins} minutes ago`;
        else {
            const diffHours = Math.floor(diffMins / 60);
            timeAgoStr = `${diffHours} hours ago`;
        }

        // Check if stale (older than 3x interval)
        const checkIntervalMs = config.interval * 1000;
        if (diffMs < checkIntervalMs * 3) {
            isStale = false;
        }
    }

    console.log(`  ${chalk.cyan('Last Update:')} ${timeAgoStr} ${isStale && lastSuccess ? chalk.yellow('(Stale)') : ''}`);
    if (config.lastMessage) {
        const msgColor = config.lastMessage.startsWith('Error') ? chalk.red : chalk.green;
        console.log(`  ${chalk.cyan('Message:')} ${msgColor(config.lastMessage)}`);
    }

    // 3. Service Status
    console.log(chalk.bold(`\n🛠️  Service Status`));

    // Check service status
    let serviceStatus = chalk.gray('Unknown');
    let serviceLabel = 'Service';

    if (process.platform === 'linux') {
        serviceLabel = 'Systemd';
        try {
            const { stdout } = await execAsync('systemctl is-active cfddns');
            const isActive = stdout.trim() === 'active';
            serviceStatus = isActive ? chalk.green('Active (Running)') : chalk.red('Inactive');
        } catch {
            serviceStatus = chalk.gray('Not found / Not running');
        }
    } else if (process.platform === 'darwin') {
        serviceLabel = 'Launchd';
        try {
            const { stdout } = await execAsync('launchctl list com.cloudflare-ddns.client');
            if (stdout.includes('"PID"')) {
                serviceStatus = chalk.green('Active (Running)');
            } else {
                serviceStatus = chalk.green('Loaded (Not Running)');
            }
        } catch {
            // Sudo might be required to see system daemons.
            // Fallback: check process list
            try {
                // pgrep -f "cfddns start"
                // We need to exclude the current process if possible, but "cfddns status" != "cfddns start"
                const { stdout: pgrepOut } = await execAsync('pgrep -f "cfddns start"');
                if (pgrepOut.trim().length > 0) {
                    serviceStatus = chalk.green('Active (Running via PID)');
                } else {
                    serviceStatus = chalk.yellow('Not loaded (Permission denied or not installed)');
                }
            } catch {
                serviceStatus = chalk.gray('Not loaded / Not running');
            }
        }
    } else {
        serviceLabel = 'Service';
        serviceStatus = chalk.gray('N/A (Not Linux/macOS)');
    }

    console.log(`  ${chalk.cyan(serviceLabel + ':')} ${serviceStatus}`);

    // Overall Health
    let overallStatus = chalk.green('Healthy');
    if (isStale) overallStatus = chalk.yellow('Unknown (Checks delayed)');
    if (config.lastMessage?.startsWith('Error')) overallStatus = chalk.red('Error');
    if (!lastSuccess) overallStatus = chalk.gray('Not started yet');

    console.log(`  ${chalk.cyan('Health:')}  ${overallStatus}`);
    console.log('');
}
