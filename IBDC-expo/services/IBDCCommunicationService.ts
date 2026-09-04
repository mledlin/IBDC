import { ProtobufService } from "@/protobuf/ProtobufService";
import { BleAdapter } from "@/ble/BleAdapter";

// NOTE: These tag values are NOT part of IBDC_v0.2.1.proto - the schema has no
// built-in message-type framing. They're a convention assumed here, needed only
// if the device relies on a single characteristic for all messages and requires
// a leading tag byte to differentiate message types. If the device instead uses
// separate characteristics per message type, this enum can be removed and
// BleAdapter would need to expose characteristic info instead.
//
// We still need to confirm with the firmware/embedded team which approach the
// device uses. Once confirmed, if tag bytes are the approach: these values become
// a strict contract - e.g. if firmware expects 0x01 for EventNotification,
// changing it to 0x02 here will make the device's messages fail to decode
// correctly on this side. Any future protocol version revisions that change tag
// values will need to be mirrored here too.

export enum IBDCMessageTag {
  // Device -> Phone
  EventNotification = 0x01,
    DeviceStatus = 0x02,
    ImageInfo = 0x03,
    ImageChunk = 0x04,
    PendingEventList = 0x05,
    // Phone -> Device
    ImageTransferRequest = 0x10,
    EventTransferAck = 0x11,
    Settings = 0x12,
    PendingEventListRequest = 0x13,
    EventInfoRequest = 0x14,
}

/** Maps each tag to the protobuf message name for ProtobufService schema lookups. */
export const IBDCMessageTagMap: { [key in IBDCMessageTag]: string } = {
  [IBDCMessageTag.EventNotification]: "EventNotification",
  [IBDCMessageTag.DeviceStatus]: "DeviceStatus",
  [IBDCMessageTag.ImageInfo]: "ImageInfo",
  [IBDCMessageTag.ImageChunk]: "ImageChunk",
  [IBDCMessageTag.PendingEventList]: "PendingEventList",
  [IBDCMessageTag.ImageTransferRequest]: "ImageTransferRequest",
  [IBDCMessageTag.EventTransferAck]: "EventTransferAck",
  [IBDCMessageTag.Settings]: "Settings",
  [IBDCMessageTag.PendingEventListRequest]: "PendingEventListRequest",
  [IBDCMessageTag.EventInfoRequest]: "EventInfoRequest",
};

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
  pendingEventCount: number;
  storageAvailablePercent: number;
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

        const tag = data[0] as IBDCMessageTag;
        const payload = data.subarray(1);
        const messageType = IBDCMessageTagMap[tag];

        if (!messageType) {
            console.warn(`IBDCCommunicationService: Received unknown tag ${tag}, ignoring.`);
            return;
        }

        try {
            switch (tag) {
                case IBDCMessageTag.EventNotification: {
                    const decodedEventNotification = ProtobufService.decode(messageType, payload) as unknown as EventNotification;
                    this.eventNotificationListeners.forEach(listener => listener(decodedEventNotification));
                    break;
                }
                case IBDCMessageTag.DeviceStatus: {
                    const decodedDeviceStatus = ProtobufService.decode(messageType, payload) as unknown as DeviceStatus;
                    this.deviceStatusListeners.forEach(listener => listener(decodedDeviceStatus));
                    break;
                }
                case IBDCMessageTag.ImageInfo: {
                    const decodedImageInfo = ProtobufService.decode(messageType, payload) as unknown as ImageInfo;
                    this.imageInfoListeners.forEach(listener => listener(decodedImageInfo));
                    break;
                }
                case IBDCMessageTag.ImageChunk: {
                    const decodedImageChunk = ProtobufService.decode(messageType, payload) as unknown as ImageChunk;
                    this.imageChunkListeners.forEach(listener => listener(decodedImageChunk));
                    break;
                }
                case IBDCMessageTag.PendingEventList: {
                    const decodedPendingEventList = ProtobufService.decode(messageType, payload) as unknown as PendingEventList;
                    this.pendingEventListListeners.forEach(listener => listener(decodedPendingEventList));
                    break;
                }
                default:
                    
                    console.warn(`IBDCCommunicationService: Received unhandled tag ${tag}, ignoring.`);
            }
        } catch (error) {
            console.error(`IBDCCommunicationService: Error decoding message for tag ${tag}:`, error);
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

    /** Encodes an outgoing message (app to device), frames it with the matching tag bytes and sends it over BLE. */
    async send(tag: IBDCMessageTag, data: Record<string, unknown>): Promise<void> {
        const messageType = IBDCMessageTagMap[tag];
        const encoded = ProtobufService.encode(messageType, data);

        const framed = new Uint8Array(encoded.length + 1);
        framed[0] = tag;
        framed.set(encoded, 1);

        await this.ble.sendData(framed);
    }

    /** Acknowledges a successful receipt of a an event and its images */
    async sendEventTransferAck(eventId: number): Promise<void> {
        await this.send(IBDCMessageTag.EventTransferAck, { eventId });
    }

    /** Write settings (e.g. images captured per event) to the device */
    async writeSettings(settings: Record<string, unknown>): Promise<void> {
        await this.send(IBDCMessageTag.Settings, settings);
    }

    /** Ask the device for the list of events not yet acknowledged by the app */
    async requestPendingEvents(): Promise<void> {
        await this.send(IBDCMessageTag.PendingEventListRequest, {});
    }

    /** Ask the device to retransmit EventNotification info for a specific event */
    async requestEventInfo(eventId: number): Promise<void> {
        await this.send(IBDCMessageTag.EventInfoRequest, { eventId });
    }

    /** Request an image transfer, resuming from a specific image/hchunk */
    async requestImageTransfer(eventId: number, startFromImage: number, startFromChunk: number): Promise<void> {
        await this.send(IBDCMessageTag.ImageTransferRequest, { eventId, startFromImage, startFromChunk });
    }
}
