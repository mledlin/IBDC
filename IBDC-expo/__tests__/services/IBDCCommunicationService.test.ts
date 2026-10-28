import { MockBleAdapter } from "@/ble/MockBleAdapter";
import { ProtobufService } from "@/protobuf/ProtobufService";
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";

test("encodes an image request using the v0.3.3 envelope", () => {
    const encoded = ProtobufService.encode("AppToDevice", {
        imageTransferRequest: {
            eventId: 12,
            startFromImage: 2,
            startFromChunk: 4,
        },
    });

    expect(ProtobufService.decode("AppToDevice", encoded)).toMatchObject({
        payload: "imageTransferRequest",
        imageTransferRequest: {
            eventId: 12,
            startFromImage: 2,
            startFromChunk: 4,
        },
    });
});

test("responds to an AppTimeRequest with the app's current time", async () => {
    const adapter = new MockBleAdapter();
    adapter.setDeviceInfo({ id: "test-device", name: "Test device" });
    await adapter.connect("test-device");

    let decodedResponse: Record<string, unknown> | undefined;
    adapter.onDeviceReceive((data) => {
        decodedResponse = ProtobufService.decode("AppToDevice", data);
    });
    new IBDCCommunicationService(adapter);

    adapter.simulateIncomingData("appTimeRequest", {});

    expect(decodedResponse).toMatchObject({
        payload: "appTimeResponse",
    });

    const time = decodedResponse?.appTimeResponse as Record<string, number>;
    expect(Object.keys(time).sort()).toEqual(["hours", "minute", "seconds"]);
    expect(time.hours).toBeGreaterThanOrEqual(0);
    expect(time.hours).toBeLessThan(24);
    expect(time.minute).toBeGreaterThanOrEqual(0);
    expect(time.minute).toBeLessThan(60);
    expect(time.seconds).toBeGreaterThanOrEqual(0);
    expect(time.seconds).toBeLessThan(60);
});
