import { ImageIngestService } from "../../services/ImageIngestService";
import type { EventNotification, IBDCCommunicationService, ImageChunk } from "../../services/IBDCCommunicationService";
import type { DAOAccessor } from "../../services/DAOAdapter";

test("ingest captures coordinates on receipt and preserves them across disconnect and image completion", async () => {
    jest.useFakeTimers({ now: 100000 });
    let notify!: (event: EventNotification) => void;
    let sendChunk!: (chunk: ImageChunk) => void;
    const ack = jest.fn(async () => {});
    const comms = {
        onEventNotifications: (listener: typeof notify) => { notify = listener; },
        onImageChunk: (listener: typeof sendChunk) => { sendChunk = listener; },
        onImageInfo: jest.fn(),
        requestImageTransfer: jest.fn(async () => {}),
        sendEventTransferAck: ack,
    };
    const dao = {
        createIncident: jest.fn<ReturnType<DAOAccessor["createIncident"]>, Parameters<DAOAccessor["createIncident"]>>(),
        createIncidentImage: jest.fn(), createSession: jest.fn(), getAllSessions: async () => [],
    };
    const read = jest.fn(async () => ({
        timestamp: Date.now(),
        coords: { latitude: (Date.now() - 100000) / 1000, longitude: 0 },
    }));
    const service = new ImageIngestService(comms as unknown as IBDCCommunicationService,
        { saveImage: () => "image.jpg" }, dao, { requestPermission: async () => true, read });
    const event = (eventId: number, timeOffsetMs: number, imageCount: number) =>
        notify({ eventId, timeOffsetMs, imageCount } as EventNotification);
    try {
        const session = await service.createConnectionSession(new Date());
        await jest.advanceTimersByTimeAsync(2000);
        event(1, 2000, 1);
        event(1, 2000, 1);
        expect(comms.requestImageTransfer).toHaveBeenCalledTimes(1);
        event(2, 0, 0);
        event(3, 3000, 0);
        await jest.advanceTimersByTimeAsync(0);
        service.endConnectionSession();
        await service.createConnectionSession(new Date());
        sendChunk({ eventId: 1, imageIndex: 0, chunkSequence: 0, totalChunks: 1,
            isLastChunk: true, payload: new Uint8Array([1]) } as ImageChunk);
        await jest.advanceTimersByTimeAsync(0);
        const rows = dao.createIncident.mock.calls;
        expect(rows).toHaveLength(3);
        const rowFor = (id: number) => rows.find(row => row[0].startsWith(`incident-${id}-`))!;
        expect(rowFor(1).slice(1, 4)).toEqual([session, 0, 0]);
        expect(rowFor(1)[15]).toBe(new Date(100000).toISOString());
        expect(rowFor(2).slice(1, 4)).toEqual([session, 2, 0]);
        expect(rowFor(3).slice(2, 4)).toEqual([null, null]);
        expect(ack).toHaveBeenCalledTimes(3);
    } finally {
        service.endConnectionSession();
        jest.useRealTimers();
    }
});
