import chalk from 'chalk';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import util from 'node:util';
// import { ConfigService } from '../services/config.service.js';

const execAsync = util.promisify(exec);

export async function serviceCommand(action: 'install' | 'uninstall') {
    const serviceName = 'cfddns';
    const servicePath = `/etc/systemd/system/${serviceName}.service`;

    if (process.getuid && process.getuid() !== 0) {
        console.error(chalk.red('Error: This command requires root privileges. Please run with sudo.'));
        process.exit(1);
    }

    if (action === 'install') {
        console.log(chalk.yellow('Installing Systemd service...'));

        // Determine user: if running with sudo, we might want to run the service as the real user?
        // Or run as root? Since config is in user dir, we should run as user.
        // Or we should move config to /etc/.
        // For simplicity with Option 2, let's assume config is in user's home or global /etc.
        // The ConfigService looks in ~/.config/cloudflare-ddns/config.json.
        // If run as root, it looks in /root/.config/...
        // If we want it to run as a specific user, we need to know which user.
        // Let's assume the user runs `sudo cfddns service install` and we grab the SUDO_USER env var.

        const sudoUser = process.env.SUDO_USER;
        const user = sudoUser || 'root';
        // const group = process.env.SUDO_GID ? process.env.SUDO_GID : 'root'; // Simplified

        // If running as a user who installed the binary in their path...
        // The ExecStart should point to the absolute path of the current executable.
        const execPath = process.execPath;

        /* 
           NOTE: When compiled with bun, process.execPath is the path to the binary.
           When running with `bun src/index.ts`, it is `bun`.
           We need to handle provided arguments if not compiled.
           But this action implies "Standalone Binary".
        */

        // const configService = new ConfigService(); // Will resolve valid path for CURRENT user (root if sudo)

        // We should probably ensure config exists for the user running the service?
        // If we run as `user`, systemd will look in `~user/.config/...`
        // This is good.

        const unitFile = `[Unit]
Description=Cloudflare DDNS Client
After=network.target

[Service]
Type=simple
User=${user}
ExecStart=${execPath} start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;

        try {
            await fs.writeFile(servicePath, unitFile);
            console.log(chalk.green(`Created ${servicePath}`));

            await execAsync('systemctl daemon-reload');
            await execAsync(`systemctl enable ${serviceName}`);
            await execAsync(`systemctl start ${serviceName}`);

            console.log(chalk.green('Service installed and started successfully!'));
            console.log(chalk.blue(`Check status with: systemctl status ${serviceName}`));
        } catch (error) {
            console.error(chalk.red('Failed to install service:'), error);
        }
    } else {
        // Uninstall
        console.log(chalk.yellow('Uninstalling Systemd service...'));
        try {
            await execAsync(`systemctl stop ${serviceName}`);
            await execAsync(`systemctl disable ${serviceName}`);
            await fs.unlink(servicePath);
            await execAsync('systemctl daemon-reload');
            console.log(chalk.green('Service uninstalled successfully.'));
        } catch (error) {
            console.error(chalk.red('Failed to uninstall service:'), error);
        }
    }
}
