// Bridges incomming BLE event/image messages to on-disk files and database rows
import {Directory, File, Paths} from "expo-file-system";
import { IBDCCommunicationService, EventNotification, ImageInfo, ImageChunk } from "./IBDCCommunicationService";
import { createSession } from "@/database/SessionDao";
import { createIncident } from "@/database/IncidentDao";
import { createIncidentImage} from "@/database/ImageDao";
import { concatUint8Arrays } from "@/utils/base64";
import { ExpoImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "./DAOAdapter";


let IMAGE_DIRECTORY = new Directory(Paths.document, "incident_images");


interface PendingImage {
    totalChunks: number;
    imageFormat?: string;
    chunks: Map<number, Uint8Array>;
}

interface PendingEvent {
    imageCount: number;
    detectedAt: string;
    images: Map<number, PendingImage>;
    imagePaths: Map<number,string>;
}

export interface ImageStorage {
    // Returns the uri where the file was saved
    saveImage: (fileName: string, data: Uint8Array) => string,
}

export interface DAOAccessor {
    createSession: (sessionId: string, createdTime: string) => Promise<void>,
    createIncident: (id: string,
                     sessionId: string,
                     latitude: number | null,
                     longitude: number | null,
                     licensePlate: string | null,
                     bestImageId: string | null,
                     injurySeverity: string | null,
                     driverPresent: number,
                     driverInformation: string | null,
                     extraComment: string | null,
                     vehicleMake: string | null,
                     vehicleModel: string | null,
                     vehicleColor: string | null,
                     vehicleYear: string | null,
                     createdTime: string) => Promise<void>,
    createIncidentImage: (id: string,
                          incidentId: string,
                          filePath: string,
                          thumbnail: any,
                          source: string) => Promise<void>
}


function extensionForFormat(imageFormat: string | undefined): string {
    switch (imageFormat) {
        case "IMAGE_FORMAT_PNG":
            return "png";
        case "IMAGE_FORMAT_JPEG":
        default:
            return "jpg";
    }
}

export class ImageIngestService {
    private readonly communicationService: IBDCCommunicationService;
    private pendingEvents = new Map<number, PendingEvent>();

    private imageStorage: ImageStorage;
    private daoAccessor: DAOAccessor;

    // Pass in the image store here. In production, the Expo based native file system. For testing, the mock
    constructor(communicationService: IBDCCommunicationService, imageStorage?: ImageStorage,
                daoAccess?: DAOAccessor) {
        this.communicationService = communicationService;
        this.communicationService.onEventNotifications(this.handleEventNotification);
        this.communicationService.onImageInfo(this.handleImageInfo);
        this.communicationService.onImageChunk(this.handleImageChunk);

        // These are optionally passed in for testing
        if (imageStorage) {
            this.imageStorage = imageStorage;
        }
        if (daoAccess) {
            this.daoAccessor = daoAccess;
        }

        this.daoAccessor = new DAOAdapter();
        this.imageStorage = new ExpoImageStorage();

    }

    private handleEventNotification = (event: EventNotification) => {
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

    // Test here
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
 
        try {
            // Change this code
            // makes this safe to call on every image, not just the first.
            //IMAGE_DIRECTORY.create({ intermediates: true, idempotent: true });
            //this.imageStorage.createDirectory();
        } catch (error) {
            console.error("ImageIngestService: failed to create incident_images directory:", error);
            return;
        }
 
        const extension = extensionForFormat(pendingImage.imageFormat);
        // Change this code into something like
        /**
         * this.imageSaver.getImage(image_storage: storage, file_name: string)
         * this.imageSaver.saveImage(assembled)
         */
        //const file = new File(IMAGE_DIRECTORY, `event_${eventId}_image_${imageIndex}.${extension}`);
        const imageName: string = `event_${eventId}_image_${imageIndex}.${extension}`;
        const fileUri: string = this.imageStorage.saveImage(imageName, assembled);
        //file.write(assembled);
 
        pendingEvent.imagePaths.set(imageIndex, fileUri);
        pendingEvent.images.delete(imageIndex);
 
        if (pendingEvent.imagePaths.size === pendingEvent.imageCount) {
            await this.finalizeIncident(eventId, pendingEvent);
        }
    }
 
    private async finalizeIncident(eventId: number, pendingEvent: PendingEvent): Promise<void> {
        console.log("Finalizing Incident", eventId);

        const sessionId = `session-${eventId}-${Date.now()}`;
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
    }
}
 