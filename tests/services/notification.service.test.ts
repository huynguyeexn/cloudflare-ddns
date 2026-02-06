import { expect, test, describe, spyOn, afterEach, type Mock } from "bun:test";
import { NotificationService } from "../../src/services/notification.service";

describe("NotificationService", () => {
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

    test("should not send notification if disabled", async () => {
        const fetchSpy = spyOn(global, "fetch");
        spies.push(fetchSpy);
        const service = new NotificationService({ enabled: false, provider: "ntfy" });

        await service.send("Title", "Message");
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    test("should send NTFY notification correctly", async () => {
        const fetchSpy = spyOn(global, "fetch").mockResolvedValue(new Response("ok"));
        spies.push(fetchSpy);
        const config = {
            enabled: true,
            provider: "ntfy" as const,
            ntfy: {
                url: "https://ntfy.sh",
                topic: "test-topic",
                token: "test-token"
            }
        };
        const service = new NotificationService(config);

        await service.send("Test Title", "Test Message", "high");

        expect(fetchSpy).toHaveBeenCalled();
        const call = fetchSpy.mock.calls[0]!;
        const url = call[0];
        const init = call[1];

        expect(url).toBe("https://ntfy.sh/test-topic");
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe("Test Message");
        // @ts-expect-error - Custom headers access
        expect(init?.headers?.["Title"]).toBe("Test Title");
        // @ts-expect-error - Custom headers access
        expect(init?.headers?.["Priority"]).toBe("high");
        // @ts-expect-error - Custom headers access
        expect(init?.headers?.["Authorization"]).toBe("Bearer test-token");
    });

    test("should handle NTFY without token", async () => {
        const fetchSpy = spyOn(global, "fetch").mockResolvedValue(new Response("ok"));
        spies.push(fetchSpy);
        const config = {
            enabled: true,
            provider: "ntfy" as const,
            ntfy: {
                url: "https://ntfy.sh",
                topic: "test-topic"
            }
        };
        const service = new NotificationService(config);

        await service.send("Title", "Message");

        expect(fetchSpy).toHaveBeenCalled();
        const init = fetchSpy.mock.calls[0]![1];
        // @ts-expect-error - Authorization header check
        expect(init?.headers?.["Authorization"]).toBeUndefined();
    });
});
