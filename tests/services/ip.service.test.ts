import { expect, test, describe, spyOn, afterEach, type Mock } from "bun:test";
import { IpService } from "../../src/services/ip.service";

describe("IpService", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let spies: Mock<any>[] = [];

    afterEach(() => {
        for (const spy of spies) {
            spy.mockRestore();
        }
        spies = [];
        // @ts-expect-error - mockRestore is available on mocked fetch
        if (global.fetch.mockRestore) {
            // @ts-expect-error - mockRestore is available on mocked fetch
            global.fetch.mockRestore();
        }
    });

    test("getIpV4 should return valid IP when API succeeds", async () => {
        const mockIp = "1.2.3.4";
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response(mockIp));
        spies.push(spy);

        const ip = await IpService.getIpV4();
        expect(ip).toBe(mockIp);
    });

    test("getIpV4 should return null when all APIs fail", async () => {
        const spy = spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
        spies.push(spy);

        const ip = await IpService.getIpV4();
        expect(ip).toBeNull();
    });

    test("getIpV4 should return null when API returns invalid IP", async () => {
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response("invalid-ip"));
        spies.push(spy);

        const ip = await IpService.getIpV4();
        expect(ip).toBeNull();
    });

    test("getIpV6 should return valid IP when API succeeds", async () => {
        const mockIp = "2001:db8::1";
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response(mockIp));
        spies.push(spy);

        const ip = await IpService.getIpV6();
        expect(ip).toBe(mockIp);
    });

    test("getIpV6 should return null when all APIs fail", async () => {
        const spy = spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
        spies.push(spy);

        const ip = await IpService.getIpV6();
        expect(ip).toBeNull();
    });
});
