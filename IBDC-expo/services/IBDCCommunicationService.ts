import { ProtobufService } from "@/protobuf/ProtobufService";
import { BleAdapter } from "@/ble/BleAdapter";

//IBDC_v0.3.2.proto introduced AppToDevice/DeviceTo app wrapper messages, each a 'oneof payload'.
// Names of the DeviceToApp ofone variants, as decoded by protobufjs
type DeviceToAppPayload = 
| "eventNotification"
| "imageInfo"
| "imageChunk"
| "deviceStatus"
| "pendingEventList";

// Name of the AppToDevicePayload oneof vaiants, as expected by protobufjs
type AppToDevicePayload = 
| "imageTransferRequest"
| "eventTransferAck"
| "settings"
| "pendingEventListRequest"
| "eventInfoRequest";


// Decoded message shapes (currently wired up to listeners: EventNotification, DeviceStatus)

export interface EventNotification {
  eventId: number;
  distanceCm: number;
  timeOffsetMs: number;
  imageCount: number;
  imageFormat: string;
   // enum name as string, e.g., "IMAGE_FORMAT_JPEG". "IMAGE_FORMAT_JPEG" and "IMAGE_FORMAT_UNSPECIFIED" 
   // are the only two formats currently supported by the device. The device will return an error if any other format is requested.
}

export interface DeviceStatus {
  protocolVersion: number;
  batteryPercent: number;
  pendingEvents: number;
  storageAvailablePercent: number;
  imagesPerEventSetting: number;
}

export interface ImageInfo {
  eventId: number;
  imageIndex: number;
  imageSizeBytes: number;
  totalChunks: number;
  imageFormat: string; 
}

export interface ImageChunk {
    eventId: number;
    imageIndex: number;
    chunkSequence: number;
    isLastChunk: boolean;
    payload: Uint8Array;
    totalChunks: number;
}

export interface PendingEventList {
    eventIds: number[];
}

type EventNotificationListener = (message: EventNotification) => void;
type DeviceStatusListener = (message: DeviceStatus) => void;
type ImageInfoListener = (message: ImageInfo) => void;
type ImageChunkListener = (message: ImageChunk) => void;
type PendingEventListListener = (message: PendingEventList) => void;
type Unsubscribe = () => void;

export class IBDCCommunicationService {
    private readonly ble: BleAdapter;
    private eventNotificationListeners = new Set<EventNotificationListener>();
    private deviceStatusListeners = new Set<DeviceStatusListener>();
    private imageInfoListeners = new Set<ImageInfoListener>();
    private imageChunkListeners = new Set<ImageChunkListener>()
    private pendingEventListListeners = new Set<PendingEventListListener>();

    constructor(ble: BleAdapter) {
        this.ble = ble;
        this.ble.onDataReceived(this.handleIncoming);
    }

    private handleIncoming = (data: Uint8Array) => {
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
                default:
                    
                    console.warn(`IBDCCommunicationService: Received DeviceToApp envelope with unhandled payload ${payload}, ignoring.`);
            }
        } catch (error) {
            console.error(`IBDCCommunicationService: Error handling payload "${payload}":`, error);
        }
    };

    /** Subscribe to decoded EventNotification messages. Returns an unsubscribe function. */
    onEventNotifications(listener: EventNotificationListener): Unsubscribe {
        this.eventNotificationListeners.add(listener);
        return () => this.eventNotificationListeners.delete(listener);
    }

    /** Subscribe to decoded DeviceStatus messages. Returns an unsubscribe function. */
    onDeviceStatus(listener: DeviceStatusListener): Unsubscribe {
        this.deviceStatusListeners.add(listener);
        return () => this.deviceStatusListeners.delete(listener);
    }

    /** Subscribe to decoded ImageInfo messages. Returns an unsubscribe function. */
    onImageInfo(listener: ImageInfoListener): Unsubscribe {
        this.imageInfoListeners.add(listener);
        return () => this.imageInfoListeners.delete(listener);
    }

    /** Subscribe to decoded ImageChunk messages. Returns an unsubscribe function. */
    onImageChunk(listener: ImageChunkListener): Unsubscribe {
        this.imageChunkListeners.add(listener);
        return () => this.imageChunkListeners.delete(listener);
    }

    /** Subscribe to decoded PendingEventList messages. Returns an unsubscribe function. */
    onPendingEventList(listener: PendingEventListListener): Unsubscribe {
        this.pendingEventListListeners.add(listener);
        return () => this.pendingEventListListeners.delete(listener);
    }

    
    async send(payloadField: AppToDevicePayload, data: Record<string,unknown>): Promise<void> {
        const encoded = ProtobufService.encode("AppToDevice", {[payloadField]: data});
        await this.ble.sendData(encoded);
    }

    /** Acknowledges a successful receipt of a an event and its images */
    async sendEventTransferAck(eventId: number): Promise<void> {
        await this.send("eventTransferAck", { eventId });
    }

    /** Write settings (e.g. images captured per event) to the device */
    async writeSettings(settings: Record<string, unknown>): Promise<void> {
        await this.send("settings", settings);
    }

    /** Ask the device for the list of events not yet acknowledged by the app */
    async requestPendingEvents(): Promise<void> {
        await this.send("pendingEventListRequest", {});
    }

    /** Ask the device to retransmit EventNotification info for a specific event */
    async requestEventInfo(eventId: number): Promise<void> {
        await this.send("eventInfoRequest", { eventId });
    }

    /** Request an image transfer, resuming from a specific image/hchunk */
    async requestImageTransfer(eventId: number, startFromImage: number, startFromChunk: number): Promise<void> {
        await this.send("imageTransferRequest", { eventId, startFromImage, startFromChunk });
    }
}
