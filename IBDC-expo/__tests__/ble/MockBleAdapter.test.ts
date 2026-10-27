import {MockBleAdapter} from "@/ble/MockBleAdapter";

describe("MockBleAdapter disconnect notifications", () => {
    test("notifies listeners when an active device disconnects", async () => {
        const adapter = new MockBleAdapter();
        adapter.setDeviceInfo({id: "mock-device", name: "Mock Device"});
        const listener = jest.fn();
        adapter.onDisconnected(listener);

        await adapter.connect("mock-device");
        await adapter.disconnect();

        expect(listener).toHaveBeenCalledWith("mock-device");
        expect(adapter.isConnected()).toBe(false);
    });

    test("does not notify listeners when already disconnected", async () => {
        const adapter = new MockBleAdapter();
        const listener = jest.fn();
        adapter.onDisconnected(listener);

        await adapter.disconnect();

        expect(listener).not.toHaveBeenCalled();
    });

    test("stops notifying after the listener unsubscribes", async () => {
        const adapter = new MockBleAdapter();
        adapter.setDeviceInfo({id: "mock-device", name: "Mock Device"});
        const listener = jest.fn();
        const unsubscribe = adapter.onDisconnected(listener);
        unsubscribe();

        await adapter.connect("mock-device");
        await adapter.disconnect();

        expect(listener).not.toHaveBeenCalled();
    });
});
