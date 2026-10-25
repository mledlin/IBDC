import { ProtobufService } from "@/protobuf/ProtobufService";
import { BleAdapter } from "@/ble/BleAdapter";

/** Device-to-app oneof payload variants decoded by protobufjs. */
type DeviceToAppPayload = 
| "eventNotification"
| "imageInfo"
| "imageChunk"
| "deviceStatus"
| "pendingEventList"
| "appTimeRequest";

/** App-to-device oneof payload variants expected by protobufjs. */
type AppToDevicePayload = 
| "imageTransferRequest"
| "eventTransferAck"
| "pendingEventListRequest"
| "eventInfoRequest"
| "appTimeResponse";

/** Image formats defined by the v0.3.3 protocol. */
export type ImageFormat =
    | "IMAGE_FORMAT_UNSPECIFIED"
    | "IMAGE_FORMAT_JPEG"
    | "IMAGE_FORMAT_PNG";


/** Metadata announced by the device when a detection event occurs. */
export interface EventNotification {
  /** Device-assigned identifier for the event. */
  eventId: number;
  /** Measured distance associated with the event, in centimeters. */
  distanceCm: number;
  /** Time between event detection and notification, in milliseconds. */
  timeOffsetMs: number;
  /** Number of images associated with the event. */
  imageCount: number;
  /**
   * Protobuf image-format enum name. The device currently supports JPEG and
   * unspecified formats; requesting other formats may result in an error.
   */
  imageFormat: ImageFormat;
}

/** Current operational status reported by the device. */
export interface DeviceStatus {
  /** Protocol version supported by the device. */
  protocolVersion: number;
  /** Remaining battery charge, as a percentage. */
  batteryPercent: number;
  /** Number of events awaiting acknowledgement by the app. */
  pendingEvents: number;
  /** Remaining device storage, as a percentage. */
  storageAvailablePercent: number;
}

/** Metadata describing an image being transferred from the device. */
export interface ImageInfo {
  /** Identifier of the event containing the image. */
  eventId: number;
  /** Zero-based image index within the event. */
  imageIndex: number;
  /** Total image size, in bytes. */
  imageSizeBytes: number;
  /** Number of chunks used to transfer the image. */
  totalChunks: number;
  /** Protobuf image-format enum name. */
  imageFormat: ImageFormat;
}

/** One byte chunk of an image transfer. */
export interface ImageChunk {
    /** Identifier of the event containing the image. */
    eventId: number;
    /** Zero-based image index within the event. */
    imageIndex: number;
    /** Zero-based sequence number of this chunk. */
    chunkSequence: number;
    /** Whether this is the final chunk in the image. */
    isLastChunk: boolean;
    /** Raw image bytes in this chunk. */
    payload: Uint8Array;
    /** Total number of chunks in the image. */
    totalChunks: number;
}

/** Identifiers of events still pending on the device. */
export interface PendingEventList {
    /** Device-assigned identifiers for unacknowledged events. */
    eventIds: number[];
}

/** Handler for decoded event notification messages. */
type EventNotificationListener = (message: EventNotification) => void;
/** Handler for decoded device status messages. */
type DeviceStatusListener = (message: DeviceStatus) => void;
/** Handler for decoded image metadata messages. */
type ImageInfoListener = (message: ImageInfo) => void;
/** Handler for decoded image chunk messages. */
type ImageChunkListener = (message: ImageChunk) => void;
/** Handler for decoded pending event list messages. */
type PendingEventListListener = (message: PendingEventList) => void;
/** Function that removes a previously registered listener. */
type Unsubscribe = () => void;

/**
 * Encodes app-to-device requests and dispatches decoded device-to-app messages
 * to subscribers.
 */
export class IBDCCommunicationService {
    // This can become read only when mock/real adapter switching is removed
    // from the final production application. 
    private ble: BleAdapter;
    private eventNotificationListeners = new Set<EventNotificationListener>();
    private deviceStatusListeners = new Set<DeviceStatusListener>();
    private imageInfoListeners = new Set<ImageInfoListener>();
    private imageChunkListeners = new Set<ImageChunkListener>()
    private pendingEventListListeners = new Set<PendingEventListListener>();

    /**
     * Creates the service and registers its incoming-data handler with the adapter.
     * @param ble Adapter used to send and receive BLE data.
     */
    constructor(ble: BleAdapter) {
        this.ble = ble;
        this.ble.onDataReceived(this.handleIncoming);
    }

    /**
     * Replaces the active adapter while preserving existing message subscribers.
     * @param ble Adapter to use for subsequent communication.
     */
    setAdapter(ble: BleAdapter): void{
        this.ble = ble;
        ble.onDataReceived(this.handleIncoming);
    }

    private handleIncoming = (data: Uint8Array) => {
        console.log("Handling incoming data within the IBDCCommunicationService");
        if (data.length === 0) {
            console.warn("IBDCCommunicationService: Received empty data from BLE device, ignoring.");
            return;
        }

        let decoded: Record<string, unknown>;
        try {
            decoded = ProtobufService.decode("DeviceToApp", data);
        } catch (error) {
            console.log("IBDCCommunicationService: Error decoding DeviceToApp envelope", error);
            return;
        }

        const payload = decoded.payload as DeviceToAppPayload | undefined;

        try {
            switch (payload) {
                case "eventNotification": {
                    console.log("Event Notification detected within IBDCCommunicationService.handleIncoming. Passing to" +
                        "its eventNotification listeners. ");
                    const decodedEventNotification = decoded.eventNotification as unknown as EventNotification;
                    this.eventNotificationListeners.forEach(listener => listener(decodedEventNotification));
                    break;
                }
                case "deviceStatus": {
                    const decodedDeviceStatus = decoded.deviceStatus as unknown as DeviceStatus;
                    this.deviceStatusListeners.forEach(listener => listener(decodedDeviceStatus));
                    break;
                }
                case "imageInfo": {
                    const decodedImageInfo = decoded.imageInfo as unknown as ImageInfo;
                    this.imageInfoListeners.forEach(listener => listener(decodedImageInfo));
                    break;
                }
                case "imageChunk": {
                    const decodedImageChunk = decoded.imageChunk as unknown as ImageChunk;
                    this.imageChunkListeners.forEach(listener => listener(decodedImageChunk));
                    break;
                }
                case "pendingEventList": {
                    const decodedPendingEventList = decoded.pendingEventList as unknown as PendingEventList;
                    this.pendingEventListListeners.forEach(listener => listener(decodedPendingEventList));
                    break;
                }
                case "appTimeRequest": {
                    this.sendCurrentTimeResponse().catch(error => {
                        console.error("IBDCCommunicationService: failed to respond to AppTimeRequest:", error);
                    });
                    break;
                }
                default:
                    
                    console.warn(`IBDCCommunicationService: Received DeviceToApp envelope with unhandled payload ${payload}, ignoring.`);
            }
        } catch (error) {
            console.error(`IBDCCommunicationService: Error handling payload "${payload}":`, error);
        }
    };

    /**
     * Subscribes to decoded event notification messages.
     * @param listener Handler invoked for each event notification.
     * @returns A function that unregisters the listener.
     */
    onEventNotifications(listener: EventNotificationListener): Unsubscribe {
        this.eventNotificationListeners.add(listener);
        return () => this.eventNotificationListeners.delete(listener);
    }

    /**
     * Subscribes to decoded device status messages.
     * @param listener Handler invoked for each status update.
     * @returns A function that unregisters the listener.
     */
    onDeviceStatus(listener: DeviceStatusListener): Unsubscribe {
        this.deviceStatusListeners.add(listener);
        return () => this.deviceStatusListeners.delete(listener);
    }

    /**
     * Subscribes to decoded image metadata messages.
     * @param listener Handler invoked for each image metadata message.
     * @returns A function that unregisters the listener.
     */
    onImageInfo(listener: ImageInfoListener): Unsubscribe {
        this.imageInfoListeners.add(listener);
        return () => this.imageInfoListeners.delete(listener);
    }

    /**
     * Subscribes to decoded image chunk messages.
     * @param listener Handler invoked for each image chunk.
     * @returns A function that unregisters the listener.
     */
    onImageChunk(listener: ImageChunkListener): Unsubscribe {
        this.imageChunkListeners.add(listener);
        return () => this.imageChunkListeners.delete(listener);
    }

    /**
     * Subscribes to decoded pending event list messages.
     * @param listener Handler invoked for each pending event list.
     * @returns A function that unregisters the listener.
     */
    onPendingEventList(listener: PendingEventListListener): Unsubscribe {
        this.pendingEventListListeners.add(listener);
        return () => this.pendingEventListListeners.delete(listener);
    }

    /**
     * Encodes an app-to-device payload and sends it through the active adapter.
     * @param payloadField Name of the oneof field to encode.
     * @param data Payload fields to encode.
     * @returns A promise that resolves when the adapter completes the send.
     */
    async send(payloadField: AppToDevicePayload, data: Record<string,unknown>): Promise<void> {
        const encoded = ProtobufService.encode("AppToDevice", {[payloadField]: data});
        await this.ble.sendData(encoded);
    }

    /**
     * Acknowledges successful receipt of an event and its images.
     * @param eventId Identifier of the event to acknowledge.
     * @returns A promise that resolves when the acknowledgement is sent.
     */
    async sendEventTransferAck(eventId: number): Promise<void> {
        await this.send("eventTransferAck", { eventId });
    }

    /** Responds to the device's time request using the app's local clock. */
    private async sendCurrentTimeResponse(): Promise<void> {
        const now = new Date();
        await this.send("appTimeResponse", {
            hours: now.getHours(),
            minute: now.getMinutes(),
            seconds: now.getSeconds(),
        });
    }

    /**
     * Requests the list of events that have not yet been acknowledged by the app.
     * @returns A promise that resolves when the request is sent.
     */
    async requestPendingEvents(): Promise<void> {
        await this.send("pendingEventListRequest", {});
    }

    /**
     * Requests the device to retransmit notification metadata for an event.
     * @param eventId Identifier of the event to request.
     * @returns A promise that resolves when the request is sent.
     */
    async requestEventInfo(eventId: number): Promise<void> {
        await this.send("eventInfoRequest", { eventId });
    }

    /**
     * Requests an image transfer, optionally resuming at a specific image and chunk.
     * @param eventId Identifier of the event whose images are requested.
     * @param startFromImage Zero-based image index at which to resume.
     * @param startFromChunk Zero-based chunk index at which to resume.
     * @returns A promise that resolves when the request is sent.
     */
    async requestImageTransfer(eventId: number, startFromImage: number, startFromChunk: number): Promise<void> {
        await this.send("imageTransferRequest", { eventId, startFromImage, startFromChunk });
    }
}
