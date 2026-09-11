import {MockBleAdapter} from "@/ble/MockBleAdapter";
import { BleDeviceInfo } from "./BleAdapter";

interface SimulatedDeviceState {
    protocolVersion: string;
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

const DEFAULT_DEVICE_INFO: BleDeviceInfo = {
    id: "v0.1.pb_v0.3.2",
    name: "prototype_dev_simDevice_v0.1"
}

export class SimulatedIBDC {
    private readonly adapter: MockBleAdapter;
    private readonly deviceInfo: BleDeviceInfo;
    private state: SimulatedDeviceState;
    private statusIntervalId: ReturnType<typeof setInterval> | null = null;
    private nextEventId = 1;

    constructor(adapter: MockBleAdapter, deviceInfo?: BleDeviceInfo, initialState?: Partial<SimulatedDeviceState>){
        this.adapter = adapter;
        this.deviceInfo = deviceInfo ?? {...DEFAULT_DEVICE_INFO};
        this.state = {
            protocolVersion: "v0.3.2",
            batteryPercent: 100,
            pendingEventCount: 0, 
            storageAvailablePercent: 100,
            imagesPerEventSetting: 10,
            ...initialState,
        };

        this.adapter.setDeviceInfo(this.deviceInfo);
    }
    /**Begins periodically pushing DeviceStatus updates, simulating the device's normal hearbeat. Each tick will also advance battery/storage drain slightly */
    start(intervalue_ms: number = 5000):void {
        if(this.statusIntervalId){
          return;  
        }

        this.statusIntervalId = setInterval(() => {
            this.tick();
            this.pushDeviceStatus();
        }, intervalue_ms);
    }
    /**Stops the periodic simulation */
    stop(): void {
        if (this.statusIntervalId){
            clearInterval(this.statusIntervalId);
            this.statusIntervalId = null;
        }
    }
    /**Simulates a detection event on demand */
    triggerEvent(overrides?: EventOverrides):void {
        const eventId = this.nextEventId++;
        this.state.pendingEventCount += 1;

        this.adapter.simulateIncomingData("eventNotification", {
            eventId, 
            distanceCm: overrides?.distanceCm ?? Math.floor(50 + Math.random() *200), 
            timeOffsetMs: overrides?.timeOffsetMs ?? Math.floor(Math.random() * 500),
            imageCount: overrides?.imageCount ?? 3, 
            imageFormat: overrides?.imageFormat ?? "IMAGE_FORMAT_JPEG",
        });
    }
    /**Pushes the current sumulated DeviceStatus immediately, outside the normal schedule */
    pushDeviceStatus(): void{
        this.adapter.simulateIncomingData("deviceStatus", { ...this.state});
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
        this.state.storageAvailablePercent = Math.max(0, this.state.storageAvailablePercent - .5);
    }
}