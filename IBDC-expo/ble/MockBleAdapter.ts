import {BleAdapter, BleDeviceInfo} from "../ble/BleAdapter";
import { ProtobufService } from "@/protobuf/ProtobufService";
import { IBDCMessageTag } from "@/services/IBDCCommunicationService";

export class MockBleAdapter implements BleAdapter {

    private connectedDeviceId: string | null = null;

    private recieveCallback: ((data: Uint8Array) => void) | null = null;

    private deviceInfo: BleDeviceInfo | null = null;

    setDeviceInfo(info: BleDeviceInfo): void {
        this.deviceInfo = info;
    }

    getDeviceInfo(): BleDeviceInfo | null {
        return this.deviceInfo;
    }
    /**
     * Simulates scanning for nearby BLE devices.
     */
    async scan(): Promise<BleDeviceInfo[]> {
        if(! this.deviceInfo){
            console.warn("MockBleAdapeter: scan() called but no simulated device has registerd its identity yet.")
            return[];
        }
        return[this.deviceInfo];
    }

    /**
     * Simulates connecting to a BLE device.
     */
    async connect(deviceId: string): Promise<void> {
        if (!this.deviceInfo || deviceId !== this.deviceInfo.id) {
            throw new Error(`Mock BLE device with ID ${deviceId} not found.`);
        }
        this.connectedDeviceId = deviceId;
    }

    /**
     * Simulates disconnecting from a BLE device.
     */
    async disconnect(): Promise<void> {
        this.connectedDeviceId = null;
    }

    /**
     * Simulates sending raw bytes to a BLE device.
     */
    async sendData(data: Uint8Array): Promise<void> {
        if (!this.connectedDeviceId) {
            throw new Error("Not connected to a BLE device.");
        }
        // Simulate sending data (in a real implementation, this would interact with the actual BLE device)
        // send to simulated device when implemented. Reminder to self to change later.
        console.log(`Mock sending data to device ${this.connectedDeviceId}:`, data);
    }

    /**
     * Registers a callback to handle incoming data from the BLE device.
     */
    onDataReceived(callback: (data: Uint8Array) => void): void {
        this.recieveCallback = callback;
    }

    /**
     * Simulates receiving data from the BLE device.
     */
    isConnected(): boolean {
        return this.connectedDeviceId !== null;
    }

    /**
     * Returns the ID of the currently connected BLE device, or null if not connected.
     */
    getConnectedDeviceId(): string | null {
        return this.connectedDeviceId;
    }

    /**
     * Simulates receiving data from the BLE device and invokes the registered callback.
     */
    simulateIncomingData(tag: IBDCMessageTag, messageType: string, data: Record<string, unknown>): void {
        if (!this.connectedDeviceId) {
            console.warn("Cannot simulate incoming data: Not connected to a BLE device.");
            return;
        }

        if (!this.recieveCallback) {
            console.warn("No callback registered to handle incoming data.");
            return;
        }

        const encoded = ProtobufService.encode(messageType, data);
        const framed = new Uint8Array(encoded.length + 1);
        framed[0] = tag;
        framed.set(encoded, 1);

        this.recieveCallback(framed);
    }

}
