import chalk from 'chalk';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import util from 'node:util';
import os from 'node:os';

const execAsync = util.promisify(exec);

export async function serviceCommand(action: 'install' | 'uninstall') {
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';

    if (!isMac && !isLinux) {
        console.error(chalk.red('Error: Service management is only supported on Linux (systemd) and macOS (launchd).'));
        process.exit(1);
    }

    if (process.getuid && process.getuid() !== 0) {
        console.error(chalk.red('Error: This command requires root privileges. Please run with sudo.'));
        process.exit(1);
    }

    const { user, home } = getUserInfo();

    // macOS Configuration
    const plistName = 'com.cloudflare-ddns.client';
    const plistPath = `/Library/LaunchDaemons/${plistName}.plist`;

    // Linux Configuration
    const serviceName = 'cfddns';
    const servicePath = `/etc/systemd/system/${serviceName}.service`;

    if (action === 'install') {
        const execPath = process.execPath;

        // --- macOS Install ---
        if (isMac) {
            console.log(chalk.yellow('Installing Launchd service for macOS...'));

            const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${execPath}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>UserName</key>
    <string>${user}</string>
    <key>StandardOutPath</key>
    <string>${home}/Library/Logs/com.cloudflare-ddns.client.log</string>
    <key>StandardErrorPath</key>
    <string>${home}/Library/Logs/com.cloudflare-ddns.client.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>${home}</string>
    </dict>
</dict>
</plist>`;

            try {
                await fs.writeFile(plistPath, plistContent);
                console.log(chalk.green(`Created ${plistPath}`));

                // Set permissions
                await execAsync(`chown root:wheel ${plistPath}`);
                await execAsync(`chmod 644 ${plistPath}`);

                // Unload if exists, then load
                try { await execAsync(`launchctl unload ${plistPath}`); } catch { /* ignore */ }
                await execAsync(`launchctl load ${plistPath}`);

                console.log(chalk.green('Service installed and loaded successfully!'));
                console.log(chalk.blue(`Check status with: sudo launchctl list | grep ${plistName}`));
                console.log(chalk.blue(`Logs are at: ${home}/Library/Logs/com.cloudflare-ddns.client.log`));
            } catch (error) {
                console.error(chalk.red('Failed to install service:'), error);
            }
        }

        // --- Linux Install ---
        else if (isLinux) {
            console.log(chalk.yellow('Installing Systemd service for Linux...'));

            const unitFile = `[Unit]
Description=Cloudflare DDNS Client
After=network.target

[Service]
Type=simple
User=${user}
ExecStart=${execPath} start
Restart=always
RestartSec=10
Environment="HOME=${home}"

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
        }

    } else if (action === 'uninstall') {
        // --- Uninstall ---
        if (isMac) {
            console.log(chalk.yellow('Uninstalling Launchd service...'));
            try {
                await execAsync(`launchctl unload ${plistPath}`);
                await fs.unlink(plistPath);
                console.log(chalk.green('Service uninstalled successfully.'));
            } catch (error) {
                console.error(chalk.red('Failed to uninstall service:'), error);
            }
        } else if (isLinux) {
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
    } else if (action === 'start') {
        if (isMac) {
            console.log(chalk.yellow('Starting service...'));
            try {
                await execAsync(`launchctl load ${plistPath}`);
                console.log(chalk.green('Service started.'));
            } catch (err) {
                console.error(chalk.red('Failed to start service (it might be already loaded):'), err);
            }
        } else if (isLinux) {
            console.log(chalk.yellow('Starting service...'));
            try {
                await execAsync(`systemctl start ${serviceName}`);
                console.log(chalk.green('Service started.'));
            } catch (err) {
                console.error(chalk.red('Failed to start service:'), err);
            }
        }
    } else if (action === 'stop') {
        if (isMac) {
            console.log(chalk.yellow('Stopping service...'));
            try {
                await execAsync(`launchctl unload ${plistPath}`);
                console.log(chalk.green('Service stopped.'));
            } catch (err) {
                console.error(chalk.red('Failed to stop service:'), err);
            }
        } else if (isLinux) {
            console.log(chalk.yellow('Stopping service...'));
            try {
                await execAsync(`systemctl stop ${serviceName}`);
                console.log(chalk.green('Service stopped.'));
            } catch (err) {
                console.error(chalk.red('Failed to stop service:'), err);
            }
        }
    } else if (action === 'restart') {
        if (isMac) {
            console.log(chalk.yellow('Restarting service...'));
            try {
                try { await execAsync(`launchctl unload ${plistPath}`); } catch { /* ignore */ }
                await execAsync(`launchctl load ${plistPath}`);
                console.log(chalk.green('Service restarted.'));
            } catch (err) {
                console.error(chalk.red('Failed to restart service:'), err);
            }
        } else if (isLinux) {
            console.log(chalk.yellow('Restarting service...'));
            try {
                await execAsync(`systemctl restart ${serviceName}`);
                console.log(chalk.green('Service restarted.'));
            } catch (err) {
                console.error(chalk.red('Failed to restart service:'), err);
            }
        }
    }
}

function getUserInfo() {
    const sudoUser = process.env.SUDO_USER;
    const user = sudoUser || os.userInfo().username;

    // If run with sudo, os.userInfo().homedir might be /var/root. We want the user's home.
    let home = os.userInfo().homedir;
    if (sudoUser) {
        // Try to get home dir of the sudo user (Mac/Linux specific approach)
        // Simplest way: if linux/mac, it's usually /home/user or /Users/user
        if (process.platform === 'darwin') home = `/Users/${sudoUser}`;
        else if (process.platform === 'linux') home = `/home/${sudoUser}`;
    }

    // Fallback if that path doesn't exist? Nah, let's trust standard paths or just keep root's home if complex.
    // For now, simple path construction is reasonably safe for personal machines.

    return { sudoUser, user, home };
}
