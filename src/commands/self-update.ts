import chalk from 'chalk';
import os from 'node:os';
import fs from 'node:fs/promises';
import { Logger } from '../utils/logger.js';
import { REPO_NAME, APP_VERSION } from '../constants.js';

export async function selfUpdateCommand(options: { checkOnly?: boolean }) {
    Logger.info('Checking for updates...');

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_NAME}/releases/latest`);
        if (!response.ok) {
            throw new Error(`Failed to fetch latest release: ${response.statusText}`);
        }

        const release = (await response.json()) as { tag_name: string; assets: Array<{ name: string; browser_download_url: string }> };
        const latestVersion = release.tag_name.replace(/^v/, '');

        const isNewer = (v1: string, v2: string) => {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < 3; i++) {
                const p1 = parts1[i] || 0;
                const p2 = parts2[i] || 0;
                if (p1 > p2) return true;
                if (p1 < p2) return false;
            }
            return false;
        };

        if (!isNewer(latestVersion, APP_VERSION)) {
            Logger.info(`You are already using the latest version (${chalk.green(APP_VERSION)}).`);
            return;
        }

        Logger.info(`A new version is available: ${chalk.yellow(APP_VERSION)} -> ${chalk.green(latestVersion)}`);

        if (options.checkOnly) {
            console.log(`Visit https://github.com/${REPO_NAME}/releases/latest to download manually.`);
            return;
        }

        // Detect platform and arch
        const platformMap: Record<string, string> = {
            darwin: 'macos',
            linux: 'linux'
        };
        const archMap: Record<string, string> = {
            x64: 'x64',
            arm64: 'arm64'
        };

        const platform = platformMap[os.platform()];
        const arch = archMap[os.arch()];

        if (!platform || !arch) {
            throw new Error(`Unsupported platform/architecture: ${os.platform()}/${os.arch()}`);
        }

        const expectedBinaryName = `cloudflare-ddns-${platform}-${arch}`;
        const asset = release.assets.find(a => a.name === expectedBinaryName);

        if (!asset) {
            throw new Error(`Could not find a pre-built binary for ${platform}-${arch} in the latest release.`);
        }

        Logger.info(`Downloading update from: ${asset.browser_download_url}`);

        const downloadPath = `${process.execPath}.tmp`;
        const res = await fetch(asset.browser_download_url);
        if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);

        await Bun.write(downloadPath, res);
        await fs.chmod(downloadPath, 0o755);

        // Replace the current binary
        // Note: On Unix, we can rename over a running executable
        await fs.rename(downloadPath, process.execPath);

        Logger.success(`Successfully updated to version ${chalk.green(latestVersion)}!`);
        Logger.info('Please restart the service if it is running in the background.');

    } catch (error) {
        Logger.error('Failed to update:', error);
        process.exit(1);
    }
}
