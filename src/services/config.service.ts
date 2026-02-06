import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import { ENV_VARS, DEFAULT_CONFIG_DIR, DEFAULT_CONFIG_FILE } from '../constants.js';

export interface Config {
    apiToken: string;
    records: string[]; // List of domains/subdomains
    interval: number; // in seconds, default 300
    enableIpv4?: boolean;
    enableIpv6?: boolean;
    lastKnownIp?: {
        v4?: string;
        v6?: string;
    };
    notifications?: {
        enabled: boolean;
        provider: 'ntfy';
        ntfy?: {
            url: string;
            topic: string;
            token?: string;
        };
    };
    lastSuccess?: string; // ISO Date string
    lastMessage?: string;
}

export class ConfigService {
    private configPath: string;

    constructor(customPath?: string) {
        if (customPath) {
            this.configPath = customPath;
        } else if (process.env[ENV_VARS.CONFIG_PATH]) {
            this.configPath = process.env[ENV_VARS.CONFIG_PATH]!;
        } else {
            const configDir = path.join(os.homedir(), DEFAULT_CONFIG_DIR);
            this.configPath = path.join(configDir, DEFAULT_CONFIG_FILE);
        }
    }

    async load(): Promise<Config | null> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            return JSON.parse(data) as Config;
        } catch (_error) {
            return null;
        }
    }

    async loadOrExit(): Promise<Config> {
        const config = await this.load();
        if (!config) {
            console.error(chalk.red('Configuration not found. Please run "cloudflare-ddns setup" first.'));
            process.exit(1);
        }
        return config;
    }

    async save(config: Config): Promise<void> {
        const dir = path.dirname(this.configPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    getPath(): string {
        return this.configPath;
    }
}
