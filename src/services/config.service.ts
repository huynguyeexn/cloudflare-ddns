import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export interface Config {
    apiToken: string;
    records: string[]; // List of domains/subdomains
    interval: number; // in seconds, default 300
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
        } else {
            const configDir = path.join(os.homedir(), '.config', 'cloudflare-ddns');
            this.configPath = path.join(configDir, 'config.json');
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

    async save(config: Config): Promise<void> {
        const dir = path.dirname(this.configPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    getPath(): string {
        return this.configPath;
    }
}
