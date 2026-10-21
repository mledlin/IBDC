import type {
    EventNotification,
    ImageChunk,
    ImageInfo,
    IBDCCommunicationService,
} from "@/services/IBDCCommunicationService";
import { ImageIngestService } from "@/services/ImageIngestService";
import { createIncidentImage } from "@/database/ImageDao";

jest.mock("expo-file-system", () => ({
    Directory: jest.fn().mockImplementation(() => ({
        create: jest.fn(),
    })),
    File: jest.fn().mockImplementation((_directory, filename) => ({
        uri: `file:///incident_images/${filename}`,
        write: jest.fn(),
    })),
    Paths: { document: "file:///documents" },
}));

jest.mock("@/database/ImageDao", () => ({
    createIncidentImage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/database/IncidentDao", () => ({
    createIncident: jest.fn().mockResolvedValue(undefined),
    updateIncidentBestImage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/database/SessionDao", () => ({
    createSession: jest.fn().mockResolvedValue(undefined),
    getAllSessions: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/services/VehicleDetectionService", () => ({
    vehicleDetectionService: {
        scheduleImage: jest.fn().mockResolvedValue(true),
    },
}));

describe("ImageIngestService vehicle analysis scheduling", () => {
    test("schedules only after the complete image is written and saved to the database", async () => {
        let eventListener: ((event: EventNotification) => void) | undefined;
        let infoListener: ((info: ImageInfo) => void) | undefined;
        let chunkListener: ((chunk: ImageChunk) => void) | undefined;
        const communication = {
            onEventNotifications: jest.fn((listener: (event: EventNotification) => void) => {
                eventListener = listener;
            }),
            onImageInfo: jest.fn((listener: (info: ImageInfo) => void) => {
                infoListener = listener;
            }),
            onImageChunk: jest.fn((listener: (chunk: ImageChunk) => void) => {
                chunkListener = listener;
            }),
            requestImageTransfer: jest.fn().mockResolvedValue(undefined),
            sendEventTransferAck: jest.fn().mockResolvedValue(undefined),
        } as unknown as IBDCCommunicationService;
        const schedulingOrder: string[] = [];
        const scheduler = {
            scheduleImage: jest.fn(async () => {
                schedulingOrder.push("analysis");
                return true;
            }),
        };
        const imageSaved = createIncidentImage as jest.Mock;
        imageSaved.mockImplementation(async () => {
            schedulingOrder.push("database");
        });

        new ImageIngestService(communication, scheduler);
        eventListener?.({
            eventId: 7,
            imageCount: 2,
            timeOffsetMs: 0,
            distanceCm: 0,
            imageFormat: "IMAGE_FORMAT_JPEG",
        });
        infoListener?.({
            eventId: 7,
            imageIndex: 0,
            totalChunks: 2,
            imageSizeBytes: 4,
            imageFormat: "IMAGE_FORMAT_JPEG",
        });
        chunkListener?.({
            eventId: 7,
            imageIndex: 0,
            chunkSequence: 0,
            isLastChunk: false,
            totalChunks: 2,
            payload: new Uint8Array([1, 2]),
        });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(imageSaved).not.toHaveBeenCalled();
        expect(scheduler.scheduleImage).not.toHaveBeenCalled();

        chunkListener?.({
            eventId: 7,
            imageIndex: 0,
            chunkSequence: 1,
            isLastChunk: true,
            totalChunks: 2,
            payload: new Uint8Array([3, 4]),
        });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(imageSaved).toHaveBeenCalledTimes(1);
        const [savedImageId, savedImagePath] =
            (scheduler.scheduleImage as jest.Mock).mock.calls[0];
        expect(savedImageId).toMatch(/^incident-7-\d+-image-0$/);
        expect(savedImagePath).toBe(
            "file:///incident_images/event_7_image_0.jpg"
        );
        expect(schedulingOrder).toEqual(["database", "analysis"]);
        expect(communication.sendEventTransferAck).not.toHaveBeenCalled();
    });

    test("analysis enqueue failures do not prevent a successfully received image from being acknowledged", async () => {
        let eventListener: ((event: EventNotification) => void) | undefined;
        let infoListener: ((info: ImageInfo) => void) | undefined;
        let chunkListener: ((chunk: ImageChunk) => void) | undefined;
        const communication = {
            onEventNotifications: jest.fn((listener: (event: EventNotification) => void) => {
                eventListener = listener;
            }),
            onImageInfo: jest.fn((listener: (info: ImageInfo) => void) => {
                infoListener = listener;
            }),
            onImageChunk: jest.fn((listener: (chunk: ImageChunk) => void) => {
                chunkListener = listener;
            }),
            requestImageTransfer: jest.fn().mockResolvedValue(undefined),
            sendEventTransferAck: jest.fn().mockResolvedValue(undefined),
        } as unknown as IBDCCommunicationService;
        const scheduler = {
            scheduleImage: jest.fn().mockRejectedValue(new Error("analysis unavailable")),
        };
        const logError = jest.spyOn(console, "error").mockImplementation(() => {});

        (createIncidentImage as jest.Mock).mockResolvedValue(undefined);
        new ImageIngestService(communication, scheduler);
        eventListener?.({
            eventId: 8,
            imageCount: 1,
            timeOffsetMs: 0,
            distanceCm: 0,
            imageFormat: "IMAGE_FORMAT_JPEG",
        });
        infoListener?.({
            eventId: 8,
            imageIndex: 0,
            totalChunks: 1,
            imageSizeBytes: 2,
            imageFormat: "IMAGE_FORMAT_JPEG",
        });
        chunkListener?.({
            eventId: 8,
            imageIndex: 0,
            chunkSequence: 0,
            isLastChunk: true,
            totalChunks: 1,
            payload: new Uint8Array([1, 2]),
        });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(scheduler.scheduleImage).toHaveBeenCalledTimes(1);
        expect(communication.sendEventTransferAck).toHaveBeenCalledWith(8);
        expect(logError).toHaveBeenCalled();
        logError.mockRestore();
    });
});
