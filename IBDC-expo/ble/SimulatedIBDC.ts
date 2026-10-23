import { ProtobufService } from "@/protobuf/ProtobufService";
import {MockBleAdapter} from "@/ble/MockBleAdapter";
import { BleDeviceInfo } from "./BleAdapter";
import {LoadImageData, SimulatedIBDCImageLoader} from "./SimulatedIBDCImageLoader";
import type {DeviceSettings} from "@/services/IBDCCommunicationService";

/** Maximum bytes in each simulated image chunk; kept small to exercise multi-chunk transfers. */
const IMAGE_CHUNK_SIZE = 180;

// Bundled placeholder photos used to give the simulator real, displayable
// image bytes to send, cycled across however many images an event reports. 


/** Mutable status values maintained by the simulated IBDC device. */
interface SimulatedDeviceState {
    protocolVersion: number;
    firmwareVersionLabel: string;
    batteryPercent: number;
    pendingEventCount: number;
    storageAvailablePercent: number;
    imagesPerEventSetting: number;
}

/** Optional values used to customize a simulated detection event. */
interface EventOverrides {
    distanceCm?: number;
    timeOffsetMs?: number;
    imageCount?: number;
    imageFormat?: "IMAGE_FORMAT_JPEG" | "IMAGE_FORMAT_PNG" | "IMAGE_FORMAT_UNSPECIFIED";
}

/** Event retained by the simulator until the app acknowledges its transfer. */
interface SimulatedPendingEvent {
    eventId: number, 
    distanceCm: number, 
    timeOffsetMs: number, 
    imageCount: number, 

    imageFormat: 
        | "IMAGE_FORMAT_JPEG"
        | "IMAGE_FORMAT_PNG"
        | "IMAGE_FORMAT_UNSPECIFIED";

    images: Uint8Array[];
}

//interface SimulatedEventImages {
//    images: Uint8Array[];
//    imageFormat: "IMAGE_FORMAT_JPEG" | "IMAGE_FORMAT_PNG" | "IMAGE_FORMAT_UNSPECIFIED";
//}

/** Identity used when no custom simulated device identity is supplied. */
const DEFAULT_DEVICE_INFO: BleDeviceInfo = {
    id: "v0.1.pb_v0.3.2",
    name: "prototype_dev_simDevice_v0.1"
}


/**
 * Simulates an IBDC device connected through a {@link MockBleAdapter}.
 *
 * It emits status and event messages, responds to app requests, and transfers
 * bundled placeholder images using the device communication protocol.
 */
export class SimulatedIBDC {
    private readonly adapter: MockBleAdapter;
    private readonly deviceInfo: BleDeviceInfo;
    private state: SimulatedDeviceState;
    private statusIntervalId: ReturnType<typeof setInterval> | null = null;
    private nextEventId = 1;
    private imageLoader: LoadImageData;

    //Images "captured" for events that have been notified but not yet ACKed
    //by the app, by event ID
    private pendingEvents = new Map<number, SimulatedPendingEvent>();
    private mockImageBytesPromise: Promise<Uint8Array[]> | null = null;
    
    private eventIntervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Creates a simulated device and registers its identity and app-message handler.
     * @param adapter Mock adapter used to exchange protocol messages.
     * @param deviceInfo Optional identity advertised by the simulated device.
     * @param initialState Optional overrides for the initial device status.
     */
    constructor(adapter: MockBleAdapter, imageLoader: LoadImageData,
                deviceInfo?: BleDeviceInfo, initialState?: Partial<SimulatedDeviceState>,
            ){
        this.adapter = adapter;
        this.deviceInfo = deviceInfo ?? {...DEFAULT_DEVICE_INFO};
        this.state = {
            protocolVersion: 3,
            firmwareVersionLabel: "v0.3.2",
            batteryPercent: 100,
            pendingEventCount: 0, 
            storageAvailablePercent: 100,
            imagesPerEventSetting: 3,
            ...initialState,
        };

        this.adapter.setDeviceInfo(this.deviceInfo);
        this.adapter.onDeviceReceive(this.handleAppMessage);
        this.imageLoader = imageLoader;
    }
    /**
     * Starts periodic status updates and automatic simulated detection events.
     * Status is pushed every five seconds and events are triggered every fifteen seconds.
     */
   start(): void {
    if (this.statusIntervalId || this.eventIntervalId) {
        return;
    }

    // Device status heartbeat every 5 seconds
    this.statusIntervalId = setInterval(() => {
        this.tick();
        this.pushDeviceStatus();
    }, 5000);

    // Simulated detection every 15 seconds
    this.eventIntervalId = setInterval(() => {
        this.triggerEvent({
            imageCount: this.state.imagesPerEventSetting
        }).catch(error => {
            console.error(
                "SimulatedIBDC: failed to trigger automatic event:",
                error
            );
        });
    }, 15000);
}
    /** Stops the status and automatic event timers. */
    stop(): void {
    if (this.statusIntervalId) {
        clearInterval(this.statusIntervalId);
        this.statusIntervalId = null;
    }

    if (this.eventIntervalId) {
        clearInterval(this.eventIntervalId);
        this.eventIntervalId = null;
    }
}

    /**
     * Loads and caches the bundled placeholder image bytes.
     * @returns The cached image byte arrays.
     */
    private async ensureMockImagesLoaded(): Promise<Uint8Array[]> {
        if (!this.mockImageBytesPromise) {
            this.mockImageBytesPromise = this.loadMockImageBytes();
        }
        return this.mockImageBytesPromise;
    }

    private async loadMockImageBytes(): Promise<Uint8Array[]> {
        return await this.imageLoader.loadImagesAsBytes();
    }

    /**Simulates a detection event on demand */
    /**
     * Creates and announces a simulated detection event.
     * @param overrides Optional event distance, timing, image count, and image format.
     * @returns A promise that resolves after the event notification is sent.
     * @throws If the bundled images cannot be loaded.
     */
    async triggerEvent(overrides?: EventOverrides): Promise<void> {
        console.log("Event triggered in SimulatedIBDC")
        const pool = await this.ensureMockImagesLoaded();
        const eventId = this.nextEventId++;
        const imageCount = overrides?.imageCount ?? this.state.imagesPerEventSetting;
        const imageFormat = overrides?.imageFormat ?? "IMAGE_FORMAT_JPEG";
        const distanceCm = overrides?.distanceCm ?? Math.floor(50 + Math.random() *200);
        const timeOffsetMs = overrides?.timeOffsetMs ?? Math.floor(Math.random() *500);
        const images: Uint8Array[] = [];

        for (let i = 0; i < imageCount; i++) {
            images.push(pool[i % pool.length]);
        }
        const event: SimulatedPendingEvent = {
            eventId, 
            distanceCm, 
            timeOffsetMs, 
            imageCount, 
            imageFormat, 
            images,
        };
        this.pendingEvents.set(event.eventId, event);
        this.updatePendingEventCount();
        this.sendEventNotification(event);
    }

    /** Sends an event notification for a pending event to the connected app. */
    private sendEventNotification(event: SimulatedPendingEvent): void{
        console.log(`SimulatedIBDC: sending EventNotification for evetn ${event.eventId}`);
        this.adapter.simulateIncomingData("eventNotification", {eventId: event.eventId, distanceCm: event.distanceCm, timeOffsetMs: event.timeOffsetMs, imageCount: event.imageCount, imageFormat: event.imageFormat, });
    }
    /**
     * Decodes app-to-device messages and dispatches each supported request.
     * Invalid envelopes are logged and ignored.
     */
    private handleAppMessage = (data: Uint8Array) => {
        
        let decoded: Record<string, unknown>;
        
        try {
            decoded = ProtobufService.decode("AppToDevice", data);
            
        } catch (error){
            console.error("SimulatedIBDC: failed to decode AppToDevice envelope:", error);
            return;
        }
        console.log("SimulatedIBDC received:", decoded.payload);
        switch(decoded.payload as string | undefined) {
            case "imageTransferRequest": {
                const request = decoded.imageTransferRequest as {
                    eventId: number;
                    startFromImage: number;
                    startFromChunk: number;
                };
                console.log("simulatedIBDC: image transfer requested")
                this.sendImageTransfer(request.eventId, request.startFromImage, request.startFromChunk);
                break;
            }
            case "eventTransferAck": {
                const ack = decoded.eventTransferAck as { eventId: number };
                console.log(`SimulatedIBDC: EventTransferAck recieved for event ${ack.eventId}`);
                if(!this.pendingEvents.has(ack.eventId)){console.warn(`SimulatedIBDC: ACK received for unknown event ${ack.eventId}`); break;}
                this.pendingEvents.delete(ack.eventId);
                this.updatePendingEventCount();
                this.pushDeviceStatus();
                break;
            }
            case "pendingEventListRequest": {
                const eventIds = Array.from(this.pendingEvents.keys());
                console.log("SimulatedIBDC: PendingEventListRequest received. Pending:", eventIds);
                this.adapter.simulateIncomingData("pendingEventList", {eventIds,});
                break;
            }
            case "eventInfoRequest": {
                const request = decoded.eventInfoRequest as { eventId: number };
                const event = this.pendingEvents.get(request.eventId);
                if(!event){console.warn(`SimulatedIBDC: Event not found for eventId ${request.eventId}`); break;}
                console.log(`SimulatedIBDC: EventInfoRequest resending info for event ${request.eventId}`);
                this.sendEventNotification(event);
                break;
            }
            case "settings": {
                const settings = decoded.settings as Partial<DeviceSettings>;
                if(settings.imagesPerEvent === undefined) {
                    console.warn("SimulatedIBDC: Settings received without imagesPerEvent.");
                    break;
                }
                if(!Number.isInteger(settings.imagesPerEvent)|| settings.imagesPerEvent < 1) {
                    console.warn(`SimulatedIBDC: Invalid imagesPerEvent = ${settings.imagesPerEvent}`);
                    break;
                }
                this.state.imagesPerEventSetting = settings.imagesPerEvent;
                console.log(`SimulatedIBDC: Updated imagesPerEventSetting to ${this.state.imagesPerEventSetting}`);
                this.pushDeviceStatus();
                break;
            }
            default:
                console.warn(`SimulatedIBDC: Unknown message type: ${decoded.type}`);
                break;
        }
        
    };

    /**
     * Sends image metadata and chunks for a pending event, starting at the requested offset.
     * @param eventId Identifier of the event to transfer.
     * @param startFromImage Index of the first image to transfer.
     * @param startFromChunk Index of the first chunk of that image to transfer.
     */
    private sendImageTransfer(eventId: number, startFromImage: number, startFromChunk: number): void {
        const event = this.pendingEvents.get(eventId);
        if(!event) {
            console.warn(`SimulatedIBDC: ImageTransferRequest for unknown event ${eventId}, ignoring.`);
            return;
        }
        if(startFromImage < 0 || startFromImage >= event.images.length) {
            console.warn(`SimulatedIBDC: Invalid startFromChunk = ${startFromChunk} or startFromImage = ${startFromImage} for event ${eventId}, ignoring.`);
            return;
        }
        for (let imageIndex = startFromImage; imageIndex < event.images.length; imageIndex++) {
            const bytes = event.images[imageIndex];
            const totalChunks = Math.ceil(bytes.length / IMAGE_CHUNK_SIZE);

            this.adapter.simulateIncomingData("imageInfo", {
                eventId, 
                imageIndex, 
                imageSizeBytes: bytes.length,
                totalChunks, 
                imageFormat: event.imageFormat,
            });

            const chunkStart = imageIndex === startFromImage ? startFromChunk : 0;
            if(chunkStart < 0 || chunkStart >= totalChunks) {
                console.warn(`SimulatedIBDC: Invalid chunkStart = ${chunkStart} for event ${eventId}, ignoring.`);
                return;
            }
            for (let chunkSequence = chunkStart; chunkSequence < totalChunks; chunkSequence++) {
                const start = chunkSequence * IMAGE_CHUNK_SIZE;
                const end = Math.min(start + IMAGE_CHUNK_SIZE, bytes.length);

                this.adapter.simulateIncomingData("imageChunk", {
                    eventId, 
                    imageIndex,
                    chunkSequence,
                    isLastChunk: chunkSequence ===totalChunks - 1, 
                    payload: bytes.subarray(start, end), 
                    totalChunks,
                });
            }
        }
    }
    /**
     * Sends the current device status immediately, outside the periodic schedule.
     */
    pushDeviceStatus(): void{
        this.adapter.simulateIncomingData("deviceStatus", {
            protocolVersion: this.state.protocolVersion,
            batteryPercent: this.state.batteryPercent,
            pendingEvents: this.state.pendingEventCount,
            storageAvailablePercent: this.state.storageAvailablePercent,
            imagesPerEventSetting: this.state.imagesPerEventSetting,
        });
    }
    
    /**
     * Returns a shallow snapshot of the current simulated device state.
     * @returns A read-only copy of the current state.
     */
    getState() : Readonly<SimulatedDeviceState> {
        return { ...this.state};
    }

    getDeviceInfo(): Readonly<BleDeviceInfo> {
        return { ...this.deviceInfo };
    }

    /** Decreases the simulated battery and storage levels by one percentage point. */
    private tick(): void {
        this.state.batteryPercent = Math.max(0, this.state.batteryPercent -1);
        this.state.storageAvailablePercent = Math.max(0, this.state.storageAvailablePercent - 1);
    }
    /** Synchronizes the advertised pending-event count with the pending-event map. */
    private updatePendingEventCount(): void {
        this.state.pendingEventCount = this.pendingEvents.size;
    }
}