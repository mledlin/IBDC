/** Bridges incoming BLE event and image messages to files and database records. */
import {Directory, File, Paths} from "expo-file-system";
import { IBDCCommunicationService, EventNotification, ImageInfo, ImageChunk } from "./IBDCCommunicationService";
import { createSession, getAllSessions } from "@/database/SessionDao";
import { createIncident } from "@/database/IncidentDao";
import { createIncidentImage} from "@/database/ImageDao";
import { updateIncidentBestImage } from "@/database/IncidentDao";
import { concatUint8Arrays } from "@/utils/base64";
import { SessionManager } from "@/hooks/SessionManager";
import { vehicleDetectionService } from "./VehicleDetectionService";

/** Directory used to persist image data received from the device. */
const IMAGE_DIRECTORY = new Directory(Paths.document, "incident_images");

/** Tracks chunks collected for an image that has not yet been assembled. */
interface PendingImage {
    /** Expected number of chunks in this image. */
    totalChunks: number;
    /** Protobuf image-format enum name, when supplied by image metadata. */
    imageFormat?: string;
    /** Received image chunks keyed by their zero-based sequence number. */
    chunks: Map<number, Uint8Array>;
}

/** Tracks metadata and downloaded image paths for an event in progress. */
interface PendingEvent {
    /** Number of images expected for the event. */
    imageCount: number;
    /** ISO timestamp at which the event was detected. */
    detectedAt: string;
    /** Images that are still being received or assembled, keyed by image index. */
    images: Map<number, PendingImage>;
    /** Paths of completed image files, keyed by image index. */
    imagePaths: Map<number,string>;
    /** Incident is created as soon as the first complete image has been saved. */
    incidentId: string;
    incidentCreation: Promise<void> | null;
    /** Image indices with durable database records. */
    persistedImages: Set<number>;
    /** Prevents duplicate asynchronous assembly for retransmitted final chunks. */
    savingImages: Set<number>;
}

export interface ImageAnalysisScheduler {
    scheduleImage(imageId: string, imageUri: string): Promise<boolean>;
}

/**
 * Maps a protobuf image format to its filename extension.
 * @param imageFormat Protobuf image-format enum name.
 * @returns `png` for PNG images; `jpg` otherwise.
 */
function extensionForFormat(imageFormat: string | undefined): string {
    switch (imageFormat) {
        case "IMAGE_FORMAT_PNG":
            return "png";
        case "IMAGE_FORMAT_JPEG":
        default:
            return "jpg";
    }
}

/**
 * Receives device events and image chunks, persists complete incident images,
 * creates corresponding database records, and acknowledges completed transfers.
 */
export class ImageIngestService {
    private readonly communicationService: IBDCCommunicationService;
    private readonly sessionManager = new SessionManager({
        async getAllSessions() {
            const sessions = await getAllSessions();
            return sessions.map((session) => ({
                id: session.id,
                createdTime: session.created_time,
            }));
        },
        createSession,
    });
    /** Events currently being downloaded, keyed by device-assigned event identifier. */
    private pendingEvents = new Map<number, PendingEvent>();

    /**
     * Creates the ingest service and subscribes to relevant communication messages.
     * @param communicationService Service that dispatches decoded device messages.
     */
    constructor(
        communicationService: IBDCCommunicationService,
        private readonly analysisScheduler: ImageAnalysisScheduler =
            vehicleDetectionService
    ) {
        this.communicationService = communicationService;
        this.communicationService.onEventNotifications(this.handleEventNotification);
        this.communicationService.onImageInfo(this.handleImageInfo);
        this.communicationService.onImageChunk(this.handleImageChunk);
    }

    /**
     * Creates or selects a session for a device connection.
     * @param connectionTime Time at which the connection was established.
     * @returns The identifier of the resulting session.
     */
    public async createConnectionSession(connectionTime: Date): Promise<string> {
        return this.sessionManager.createSession(connectionTime);
    }

    /** Starts tracking an event notification and requests its image transfer. */
    private handleEventNotification = (event: EventNotification) => {
        // Protects against recieving the same EventNotification more thatn once while the event is alrealdy being downloaded
        if (this.pendingEvents.has(event.eventId)){
            console.warn(`ImageIngestService: event ${event.eventId} is already being processed, ignoring ducplicate EventNotification.`);
            return;
        }
        const receivedAt = Date.now();
        const detectedAt = new Date(receivedAt - event.timeOffsetMs).toISOString();
        console.log(
            "ImageIngestService: EventNotification", event.eventId, "images:", event.imageCount
        );
        this.pendingEvents.set(event.eventId, {
            imageCount: event.imageCount,
            detectedAt,
            images: new Map(),
            imagePaths: new Map(),
            incidentId: `incident-${event.eventId}-${Date.now()}`,
            incidentCreation: null,
            persistedImages: new Set(),
            savingImages: new Set(),
        });

        this.communicationService.requestImageTransfer(event.eventId, 0, 0).catch((error) => {
            console.log(`ImageIngestService: failed to request images for event ${event.eventId}:`, error)
        });
    };

    /** Records image metadata for an event currently being ingested. */
    private handleImageInfo = (info: ImageInfo) => {
        const pendingEvent = this.pendingEvents.get(info.eventId);
        console.log("ImageIngestService: ImageInfo", info.eventId,info.imageIndex, "chunks:", info.totalChunks);
        if(!pendingEvent) {
            console.warn(`ImageIngestService: ImageInfo for unknown event ${info.eventId}:`);
            return;
        }

      const existing = pendingEvent.images.get(info.imageIndex);
        pendingEvent.images.set(info.imageIndex, {
            totalChunks: info.totalChunks,
            imageFormat: info.imageFormat,
            chunks: existing?.chunks ?? new Map(),
        });
    };
 
    /** Stores an incoming image chunk and assembles the image once complete. */
    private handleImageChunk = (chunk: ImageChunk) => {
        const pendingEvent = this.pendingEvents.get(chunk.eventId);
        if (!pendingEvent) {
            console.warn(`ImageIngestService: ImageChunk for unknown event ${chunk.eventId}, ignoring.`);
            return;
        }
 
        let pendingImage = pendingEvent.images.get(chunk.imageIndex);
        if (!pendingImage) {
            // Chunk arrived before ImageInfo - start tracking from the chunk's own totalChunks.
            pendingImage = { totalChunks: chunk.totalChunks, chunks: new Map() };
            pendingEvent.images.set(chunk.imageIndex, pendingImage);
        }
 
        pendingImage.chunks.set(chunk.chunkSequence, chunk.payload);
 
        if (chunk.isLastChunk || pendingImage.chunks.size >= pendingImage.totalChunks) {
            console.log("ImageIngestService: Complete image")
            this.finishImage(chunk.eventId, chunk.imageIndex, pendingEvent, pendingImage).catch((error) => {
                console.error(
                    `ImageIngestService: failed to finish image ${chunk.imageIndex} for event ${chunk.eventId}:`,
                    error
                );
            });
        }
    };
 
    /**
     * Assembles an image from its ordered chunks, writes it to disk, and checks
     * whether all images for the event are ready to finalize.
     */
    private async finishImage(
        eventId: number,
        imageIndex: number,
        pendingEvent: PendingEvent,
        pendingImage: PendingImage
    ): Promise<void> {
        if (
            pendingEvent.persistedImages.has(imageIndex) ||
            pendingEvent.savingImages.has(imageIndex)
        ) {
            return;
        }

        pendingEvent.savingImages.add(imageIndex);
        try {
            let filePath = pendingEvent.imagePaths.get(imageIndex);
            if (!filePath) {
                const orderedChunks: Uint8Array[] = [];
                for (let i = 0; i < pendingImage.totalChunks; i++) {
                    const chunkBytes = pendingImage.chunks.get(i);
                    if (!chunkBytes) {
                        console.warn(
                            `ImageIngestService: missing chunk ${i}/${pendingImage.totalChunks} for event ${eventId} image ${imageIndex}, waiting for retransmit.`
                        );
                        return;
                    }
                    orderedChunks.push(chunkBytes);
                }

                const assembled = concatUint8Arrays(orderedChunks);
                try {
                    IMAGE_DIRECTORY.create({ intermediates: true, idempotent: true });
                } catch (error) {
                    console.error("ImageIngestService: failed to create incident_images directory:", error);
                    return;
                }

                const extension = extensionForFormat(pendingImage.imageFormat);
                const file = new File(
                    IMAGE_DIRECTORY,
                    `event_${eventId}_image_${imageIndex}.${extension}`
                );
                file.write(assembled);
                filePath = file.uri;
                pendingEvent.imagePaths.set(imageIndex, filePath);
            }

            await this.ensureIncidentCreated(pendingEvent);
            const imageId = `${pendingEvent.incidentId}-image-${imageIndex}`;
            await createIncidentImage(
                imageId,
                pendingEvent.incidentId,
                filePath,
                null,
                "device",
                "pending"
            );
            pendingEvent.persistedImages.add(imageIndex);
            pendingEvent.images.delete(imageIndex);

            void this.analysisScheduler
                .scheduleImage(imageId, filePath)
                .catch((error) => {
                    console.error(
                        `ImageIngestService: failed to enqueue analysis for image ${imageId}:`,
                        error
                    );
                });

            if (pendingEvent.persistedImages.size === pendingEvent.imageCount) {
                await this.finalizeIncident(eventId, pendingEvent);
            }
        } finally {
            pendingEvent.savingImages.delete(imageIndex);
        }
    }

    private ensureIncidentCreated(pendingEvent: PendingEvent): Promise<void> {
        if (!pendingEvent.incidentCreation) {
            pendingEvent.incidentCreation = (async () => {
                const occurrenceTime = new Date(pendingEvent.detectedAt);
                const sessionId =
                    await this.sessionManager.getOrCreateSession(occurrenceTime);
                await createIncident(
                    pendingEvent.incidentId,
                    sessionId,
                    null, // latitude - not yet available from device/GPS
                    null, // longitude
                    null, // licensePlate
                    null, // bestImageId
                    null, // injurySeverity
                    0, // driverPresent
                    null, // driverInformation
                    null, // extraComment
                    null, // vehicleMake
                    null, // vehicleModel
                    null, // vehicleColor
                    null, // vehicleYear
                    pendingEvent.detectedAt
                );
            })().catch((error) => {
                pendingEvent.incidentCreation = null;
                throw error;
            });
        }
        return pendingEvent.incidentCreation;
    }

    /**
     * Finalizes the saved image set, acknowledges the event, and clears transfer state.
     */
    private async finalizeIncident(eventId: number, pendingEvent: PendingEvent): Promise<void> {
        console.log("Finalizing Incident", eventId);
        if (
            pendingEvent.persistedImages.size !== pendingEvent.imageCount ||
            pendingEvent.imagePaths.size !== pendingEvent.imageCount
        ) {
            return;
        }
        const firstImageIndex = Math.min(...pendingEvent.imagePaths.keys());
        await updateIncidentBestImage(
            pendingEvent.incidentId,
            `${pendingEvent.incidentId}-image-${firstImageIndex}`
        );
        await this.communicationService.sendEventTransferAck(eventId);
 
        this.pendingEvents.delete(eventId);

        console.log(`ImageIngestService: event ${eventId} saved and acknowleged`)
    }
}
 