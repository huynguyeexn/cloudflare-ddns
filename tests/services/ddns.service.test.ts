import { expect, test, describe, spyOn, afterEach, beforeEach, type Mock } from "bun:test";
import { DdnsService } from "../../src/services/ddns.service";
import { IpService } from "../../src/services/ip.service";
import { ConfigService } from "../../src/services/config.service";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("DdnsService", () => {
    let testConfigPath: string;
    let ddnsService: DdnsService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let spies: Mock<any>[] = [];

    beforeEach(async () => {
        testConfigPath = path.join(os.tmpdir(), `ddns-test-${Date.now()}.json`);
        process.env.CLOUDFLARE_DDNS_CONFIG_PATH = testConfigPath;
        ddnsService = new DdnsService();

        // Setup initial config
        const cs = new ConfigService(testConfigPath);
        await cs.save({
            apiToken: "valid-token",
            records: ["test.com"],
            interval: 300
        });
        spies = [];
    });

    afterEach(async () => {
        delete process.env.CLOUDFLARE_DDNS_CONFIG_PATH;
        try {
            await fs.unlink(testConfigPath);
        } catch {
            // ignore
        }

        for (const spy of spies) {
            spy.mockRestore();
        }

        // @ts-expect-error - mockRestore is available on mocked fetch
        if (global.fetch.mockRestore) {
            // @ts-expect-error - mockRestore is available on mocked fetch
            global.fetch.mockRestore();
        }
    });

    test("should perform update correctly when IP changes", async () => {
        spies.push(spyOn(IpService, "getIpV4").mockResolvedValue("1.1.1.1"));
        spies.push(spyOn(IpService, "getIpV6").mockResolvedValue(null));

        // Mock Cloudflare API
        // @ts-expect-error - fetch mock implementation
        const fetchSpy = spyOn(global, "fetch").mockImplementation(async (url) => {
            if (url.toString().includes("/zones/z1/dns_records")) {
                return new Response(JSON.stringify({
                    success: true,
                    result: [
                        { id: "r1", type: "A", name: "test.com", content: "2.2.2.2", proxied: true }
                    ]
                }));
            }
            if (url.toString().includes("/zones")) {
                return new Response(JSON.stringify({
                    success: true,
                    result: [
                        { id: "z1", name: "test.com", status: "active" }
                    ]
                }));
            }
            return new Response(JSON.stringify({ success: true, result: {} }));
        });
        spies.push(fetchSpy);

        await ddnsService.performUpdate();

        const patchCall = fetchSpy.mock.calls.find(call => call[1]?.method === "PATCH");
        expect(patchCall).toBeDefined();
        // @ts-expect-error - patchCall is defined
        expect(JSON.parse(patchCall[1].body)).toEqual({ content: "1.1.1.1" });

        const cs = new ConfigService(testConfigPath);
        const config = await cs.load();
        expect(config?.lastKnownIp?.v4).toBe("1.1.1.1");
    });

    test("should skip update if IPs are unchanged", async () => {
        const cs = new ConfigService(testConfigPath);
        const config = await cs.load();
        if (config) {
            config.lastKnownIp = { v4: "1.1.1.1", v6: undefined };
            await cs.save(config);
        }

        spies.push(spyOn(IpService, "getIpV4").mockResolvedValue("1.1.1.1"));
        spies.push(spyOn(IpService, "getIpV6").mockResolvedValue(null));

        const fetchSpy = spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, result: [] })));
        spies.push(fetchSpy);

        await ddnsService.performUpdate();

        const patchCall = fetchSpy.mock.calls.find(call => call[1]?.method === "PATCH");
        expect(patchCall).toBeUndefined();
    });
});
