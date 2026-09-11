import {Asset} from "expo-asset"
import { File } from "expo-file-system"
import { ProtobufService } from "@/protobuf/ProtobufService";
import {MockBleAdapter} from "@/ble/MockBleAdapter";
import { BleDeviceInfo } from "./BleAdapter";

// Max bytes per simulated BLE ImageChunk payload. I made it smaller to force multiple payload for testing. 
// real payloads will be ~180-240 bytes. 
const IMAGE_CHUNK_SIZE = 180;

// Bundled placeholder photos used to give the simulator real, displayable
// image bytes to send, cycled across however many images an event reports. 
const MOCK_IMAGE_MODULES = [
    require("@/assets/images/IBDCExampleData/1.jpeg"),
    require("@/assets/images/IBDCExampleData/2.jpeg"),
    require("@/assets/images/IBDCExampleData/3.jpeg"),
    require("@/assets/images/IBDCExampleData/4.jpeg"),
    require("@/assets/images/IBDCExampleData/5.jpeg"),
    require("@/assets/images/IBDCExampleData/6.jpeg"),
    require("@/assets/images/IBDCExampleData/7.jpeg"),
    require("@/assets/images/IBDCExampleData/8.jpeg"),
    require("@/assets/images/IBDCExampleData/9.jpeg"),
    require("@/assets/images/IBDCExampleData/10.jpeg"),
    require("@/assets/images/IBDCExampleData/11.jpeg"),
    require("@/assets/images/IBDCExampleData/12.jpeg"),
    require("@/assets/images/IBDCExampleData/13.jpeg"),
    require("@/assets/images/IBDCExampleData/14.jpeg"),
    require("@/assets/images/IBDCExampleData/15.jpeg"),
    require("@/assets/images/IBDCExampleData/16.jpeg"),
    require("@/assets/images/IBDCExampleData/17.jpeg"),
    require("@/assets/images/IBDCExampleData/18.jpeg"),
    require("@/assets/images/IBDCExampleData/19.jpeg"),
    require("@/assets/images/IBDCExampleData/20.jpeg"),
];

interface SimulatedDeviceState {
    protocolVersion: number;
    firmwareVersionLabel: string;
    batteryPercent: number;
    pendingEventCount: number;
    storageAvailablePercent: number;
    imagesPerEventSetting: number;
}

interface EventOverrides {
    distanceCm?: number;
    timeOffsetMs?: number;
    imageCount?: number;
    imageFormat?: "IMAGE_FORMAT_JPEG" | "IMAGE_FORMAT_PNG" | "IMAGE_FORMAT_UNSPECIFIED";
}

interface SimulatedEventImages {
    images: Uint8Array[];
    imageFormat: "IMAGE_FORMAT_JPEG" | "IMAGE_FORMAT_PNG" | "IMAGE_FORMAT_UNSPECIFIED";
}

const DEFAULT_DEVICE_INFO: BleDeviceInfo = {
    id: "v0.1.pb_v0.3.2",
    name: "prototype_dev_simDevice_v0.1"
}

async function loadMockImageBytes(): Promise<Uint8Array[]> {
    const assets = await Asset.loadAsync(MOCK_IMAGE_MODULES);

    const bytesList: Uint8Array[] = [];
    for (const asset of assets) {
        if(!asset.localUri) {
            throw new Error(`SimulatedIBDC: mock image asset "${asset.name}" has not localUri after loading.`)
        }
        const file = new File(asset.localUri);
        bytesList.push(await file.bytes());
    }
    return bytesList;
}

export class SimulatedIBDC {
    private readonly adapter: MockBleAdapter;
    private readonly deviceInfo: BleDeviceInfo;
    private state: SimulatedDeviceState;
    private statusIntervalId: ReturnType<typeof setInterval> | null = null;
    private nextEventId = 1;

    //Images "caputred" for events that have been notified but not yet ACKed
    //by the app, by event ID
    private eventImages = new Map<number, SimulatedEventImages>();
    private mockImageBytesPromise: Promise<Uint8Array[]> | null = null;
    
    private eventIntervalId: ReturnType<typeof setInterval> | null = null;

    constructor(adapter: MockBleAdapter, deviceInfo?: BleDeviceInfo, initialState?: Partial<SimulatedDeviceState>){
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
    }
    /**Begins periodically pushing DeviceStatus updates, simulating the device's normal hearbeat. Each tick will also advance battery/storage drain slightly */
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
     * Loads and caches the bundled mock photo bytes use to stand in for real captures. 
     */
    private async ensureMockImagesLoaded(): Promise<Uint8Array[]> {
        if (!this.mockImageBytesPromise) {
            this.mockImageBytesPromise = loadMockImageBytes();
        }
        return this.mockImageBytesPromise;
    }

    /**Simulates a detection event on demand */
    async triggerEvent(overrides?: EventOverrides): Promise<void> {
        const pool = await this.ensureMockImagesLoaded();

        const eventId = this.nextEventId++;
        const imageCount = overrides?.imageCount ?? 3;
        const imageFormat = overrides?.imageFormat ?? "IMAGE_FORMAT_JPEG";
        this.state.pendingEventCount += 1;

        const images: Uint8Array[] = [];
        for (let i = 0; i < imageCount; i++) {
            images.push(pool[i % pool.length]);
        }
        this.eventImages.set(eventId, {images, imageFormat});
        this.adapter.simulateIncomingData("eventNotification", {
            eventId, 
            distanceCm: overrides?.distanceCm ?? Math.floor(50 + Math.random() *200), 
            timeOffsetMs: overrides?.timeOffsetMs ?? Math.floor(Math.random() * 500),
            imageCount,
            imageFormat,
        });
    }
    /**
     * Decodes AppToDevice envelpoes sent via BleAdapeter.sendData and reacts to them. 
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
                this.acknowledgeEvent();
                this.eventImages.delete(ack.eventId);
                break;
            }
            default:
                //come back to implement settings/pendingeventListRequets and EventInfoRequest
                break;
        }
        
    };

    private sendImageTransfer(eventId: number, startFromImage: number, startFromChunk: number): void {
        const record = this.eventImages.get(eventId);
        if(!record) {
            console.warn(`SimulatedIBDC: ImageTransferRequest for unknown event ${eventId}, ignoring.`);
            return;
        }
        for (let imageIndex = startFromImage; imageIndex < record.images.length; imageIndex++) {
            const bytes = record.images[imageIndex];
            const totalChunks = Math.ceil(bytes.length / IMAGE_CHUNK_SIZE);

            this.adapter.simulateIncomingData("imageInfo", {
                eventId, 
                imageIndex, 
                imageSizeBytes: bytes.length,
                totalChunks, 
                imageFormat: record.imageFormat,
            });

            const chunkStart = imageIndex === startFromImage ? startFromChunk : 0;
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
    /**Pushes the current sumulated DeviceStatus immediately, outside the normal schedule */
    pushDeviceStatus(): void{
        this.adapter.simulateIncomingData("deviceStatus", {
            protocolVersion: this.state.protocolVersion,
            batteryPercent: this.state.batteryPercent,
            pendingEvents: this.state.pendingEventCount,
            storageAvailablePercent: this.state.storageAvailablePercent,
            imagesPerEventSetting: this.state.imagesPerEventSetting,
        });
    }
    /** Marks an event as acknowleged, decrementing the simuleated pending count */
    acknowledgeEvent(): void{
        this.state.pendingEventCount = Math.max(0, this.state.pendingEventCount - 1);
    }
    /**retuns a read only snapshot of current simulaed device for debugging */
    getState() : Readonly<SimulatedDeviceState> {
        return { ...this.state};
    }

    getDeviceInfo(): Readonly<BleDeviceInfo> {
        return { ...this.deviceInfo };
    }
    /** Advances simulateed device state slightly, called deach tick. */
    private tick(): void {
        this.state.batteryPercent = Math.max(0, this.state.batteryPercent -1);
        this.state.storageAvailablePercent = Math.max(0, this.state.storageAvailablePercent - 1);
    }
}