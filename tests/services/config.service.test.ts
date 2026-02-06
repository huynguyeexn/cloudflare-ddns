import { expect, test, describe, afterAll } from "bun:test";
import { ConfigService, type Config } from "../../src/services/config.service";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("ConfigService", () => {
    const testConfigPath = path.join(os.tmpdir(), `test-config-${Date.now()}.json`);
    const service = new ConfigService(testConfigPath);

    afterAll(async () => {
        try {
            await fs.unlink(testConfigPath);
        } catch {
            // ignore
        }
    });

    test("should return null if config file does not exist", async () => {
        const config = await service.load();
        expect(config).toBeNull();
    });

    test("should save and load config correctly", async () => {
        const mockConfig: Config = {
            apiToken: "test-token",
            records: ["example.com", "www.example.com"],
            interval: 60,
            notifications: {
                enabled: true,
                provider: "ntfy",
                ntfy: {
                    url: "https://ntfy.sh",
                    topic: "test-topic"
                }
            }
        };

        await service.save(mockConfig);
        const loadedConfig = await service.load();

        expect(loadedConfig).toEqual(mockConfig);
    });

    test("should respect customPath in constructor", () => {
        const customPath = "/tmp/custom.json";
        const customService = new ConfigService(customPath);
        expect(customService.getPath()).toBe(customPath);
    });

    test("should respect environment variable for config path", () => {
        const envPath = "/tmp/env-config.json";
        process.env.CLOUDFLARE_DDNS_CONFIG_PATH = envPath;
        const envService = new ConfigService();
        expect(envService.getPath()).toBe(envPath);
        delete process.env.CLOUDFLARE_DDNS_CONFIG_PATH;
    });
});
