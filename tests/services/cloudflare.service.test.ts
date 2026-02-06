import { expect, test, describe, spyOn, afterEach, type Mock } from "bun:test";
import { CloudflareService, type CloudflareRecord } from "../../src/services/cloudflare.service";

describe("CloudflareService", () => {
    const service = new CloudflareService("test-token");
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

    test("verifyToken should return true if status is active", async () => {
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
            success: true,
            result: { status: "active" }
        })));
        spies.push(spy);

        const isValid = await service.verifyToken();
        expect(isValid).toBe(true);
    });

    test("getZones should return zones list", async () => {
        const mockZones = [{ id: "z1", name: "domain.com", status: "active" }];
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
            success: true,
            result: mockZones
        })));
        spies.push(spy);

        const zones = await service.getZones();
        expect(zones).toEqual(mockZones);
    });

    test("getRecords should filter A and AAAA records", async () => {
        const mockRecords = [
            { id: "r1", type: "A", name: "auth.domain.com", content: "1.1.1.1", proxied: true },
            { id: "r2", type: "CNAME", name: "cdn", content: "target.com" },
            { id: "r3", type: "AAAA", name: "auth.domain.com", content: "::1", proxied: false }
        ];
        const spy = spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
            success: true,
            result: mockRecords
        })));
        spies.push(spy);

        const records = await service.getRecords("zone123");
        expect(records.length).toBe(2);
        expect(records.map(r => r.type)).toContain("A");
        expect(records.map(r => r.type)).toContain("AAAA");
        expect(records.find(r => r.id === "r2")).toBeUndefined();
    });

    test("updateRecord should call PATCH endpoint", async () => {
        const record: CloudflareRecord = {
            id: "r1",
            zone_id: "z1",
            name: "test.com",
            type: "A",
            content: "1.2.3.4",
            proxied: true
        };

        const fetchSpy = spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
            success: true,
            result: {}
        })));
        spies.push(fetchSpy);

        const success = await service.updateRecord(record, "5.6.7.8");

        expect(success).toBe(true);
        const call = fetchSpy.mock.calls[0]!;
        const url = call[0];
        const init = call[1];

        expect(url).toContain("/zones/z1/dns_records/r1");
        expect(init?.method).toBe("PATCH");
        expect(JSON.parse(init?.body as string)).toEqual({ content: "5.6.7.8" });
    });
});
