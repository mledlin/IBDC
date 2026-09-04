import {MockBleAdapter} from "@/ble/MockBleAdapter";
import {IBDCMessageTag} from "@/services/IBDCCommunicationService";
import { BleDeviceInfo } from "./BleAdapter";

interface SimulatedDeviceState {
    protocolVersion: string;
    batteryPercent: number;
    pendingEventCount: number;
    storageAvailablePercent: number;
}

interface EventOverrides {
    distanceCm?: number;
    timeOffsetMs?: number;
    imageCount?: number;
    imageFormat?: "IMAGE_FORMAT_JPEG" | "IMAGE_FORMAT_PNG" | "IMAGE_FORMAT_UNSPECIFIED";
}

const DEFAULT_DEVICE_INFO: BleDeviceInfo = {
    id: "v0.1.pb_v0.2.1",
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
            protocolVersion: "v0.2.1",
            batteryPercent: 100,
            pendingEventCount: 0, 
            storageAvailablePercent: 100,
            ...initialState,
        };

        this.adapter.setDeviceInfo(this.deviceInfo);
    }
    /**Begins periodically pushing DeviceStatus updates, simulating the device's normal hearbeat. Each tick will also advance battery/storage drain slightly */
    start():void {

    }
    /**Stops the periodic simulation */
    stop(): void {

    }
    /**Simulates a detection event on demand */
    triggerEvent():void {

    }
    /**Pushes the current sumulated DeviceStatus immediately, outside the normal schedule */
    pushDeviceStatus(): void{

    }
    /** Marks an event as acknowleged, decrementing the simuleated pending count */
    acknowledgeEvent(): void{

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

    }
}