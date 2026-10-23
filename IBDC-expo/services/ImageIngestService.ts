// Bridges incomming BLE event/image messages to on-disk files and database rows
import {EventNotification, IBDCCommunicationService, ImageChunk, ImageInfo} from "./IBDCCommunicationService";
import {concatUint8Arrays} from "@/utils/base64";
import { SessionManager } from "@/hooks/SessionManager";
import {ImageStorage} from "@/services/ExpoImageStorage";
import {DAOAccessor} from "./DAOAdapter";




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
    /** Events currently being downloaded, keyed by device-assigned event identifier. */
    private pendingEvents = new Map<number, PendingEvent>();

    private imageStorage: ImageStorage;
    private daoAccessor: DAOAccessor;

    constructor(communicationService: IBDCCommunicationService, imageStorage: ImageStorage,
                daoAccess: DAOAccessor) {
        this.communicationService = communicationService;
        this.communicationService.onEventNotifications(this.handleEventNotification);
        this.communicationService.onImageInfo(this.handleImageInfo);
        this.communicationService.onImageChunk(this.handleImageChunk);
        this.imageStorage = imageStorage;
        this.daoAccessor = daoAccess;
    }
    private readonly sessionManager = new SessionManager({
        async getAllSessions() {
            const sessions = await this.getAllSessions();
            return sessions.map((session) => ({
                id: session.id,
                createdTime: session.createdTime,
            }));
        },
        this.daoAcessor.createSession()
    });




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
        // ---
        console.log("Handling chunk " + chunk.chunkSequence + " out of " +
        chunk.totalChunks + " with image Id " + chunk.imageIndex);

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
        // --
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
        const extension = extensionForFormat(pendingImage.imageFormat);

        const imageName: string = `event_${eventId}_image_${imageIndex}.${extension}`;
        const fileUri: string = this.imageStorage.saveImage(imageName, assembled);

        pendingEvent.imagePaths.set(imageIndex, fileUri);
        pendingEvent.images.delete(imageIndex);
 
        if (pendingEvent.imagePaths.size === pendingEvent.imageCount) {
            await this.finalizeIncident(eventId, pendingEvent);
        }
    }
 
    /**
     * Creates the incident and image database records, acknowledges the event,
     * and removes its completed transfer state.
     */
    private async finalizeIncident(eventId: number, pendingEvent: PendingEvent): Promise<void> {
        console.log("Finalizing Incident", eventId);
        const occurrenceTime = new Date(pendingEvent.detectedAt);
        const sessionId = await this.sessionManager.getOrCreateSession(occurrenceTime);
        const incidentId = `incident-${eventId}-${Date.now()}`;

        // Auto-create a new session per event (no active-ride-session concept wired in yet).
        // Maybe we can use a day time frame or when the device is first connected to eod?
        // Will need to be reviewed later.
        try{
        await this.daoAccessor.createSession(sessionId, pendingEvent.detectedAt);
        }catch(error){
            console.error("Database Finalized Failed", error);
            throw error;
        }
        //Best image just gets set to the first image, will need to find a better way later.
        const firstImageIndex = Math.min(...pendingEvent.imagePaths.keys());
        const bestImageId = `${incidentId}-image-${firstImageIndex}`; 

        await this.daoAccessor.createIncident(
            incidentId,
            sessionId,
            null, // latitude - not yet available from device/GPS
            null, // longitude
            null, // licensePlate
            bestImageId,
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
 
        for (const [imageIndex, filePath] of pendingEvent.imagePaths.entries()) {
            await this.daoAccessor.createIncidentImage(
                `${incidentId}-image-${imageIndex}`,
                incidentId,
                filePath,
                null,
                "device"
            );
        }
 
        await this.communicationService.sendEventTransferAck(eventId);
 
        this.pendingEvents.delete(eventId);

        console.log(`ImageIngestService: event ${eventId} saved and acknowleged`)
    }

    public getPendingEventSize() {
        return this.pendingEvents.size;
    }

    public getPendingEvents() {
        return this.pendingEvents;
    }
}
 